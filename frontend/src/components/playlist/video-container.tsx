import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { VideoItem } from './video-item';
import { EmptyVideoCard } from './empty-video-card';
import { YouTubeAPI, type YouTubeVideoDetails } from '@/services/youtube-api';
import type { Video } from '@/types/index';

interface VideoContainerProps {
  videos: Video[];
  onPlay: (video: Video) => void;
  onRemove?: (videoId: string) => void;
  onUpdate?: (videoId: string, updates: Partial<Video>) => void;
  onVideoAdded?: (video: Video) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  loadThumbnails?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  layout?: 'grid' | 'list';
  enableMaxresThumbnails?: boolean;
  onSetBackground?: (videoId: string) => void;
  currentBackgroundVideoId?: string | null;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  ratio?: '16:9' | '1:1';
}

export const VideoContainer = memo(function VideoContainer({
  videos,
  onPlay,
  onRemove,
  onUpdate,
  onVideoAdded,
  onReorder,
  loadThumbnails = true,
  onLoadingChange,
  layout = 'grid',
  enableMaxresThumbnails = true,
  onSetBackground,
  currentBackgroundVideoId,
  onMoveUp,
  onMoveDown,
  ratio = '16:9',
}: VideoContainerProps) {
  const [details, setDetails] = useState<Record<string, YouTubeVideoDetails>>(
    {}
  );
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const fetchedOrFetching = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const dragIndexRef = useRef<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Refs for touch drag
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchDragActive = useRef(false);

  // Text drag-and-drop to add a video
  const [isTextDragOver, setIsTextDragOver] = useState(false);
  const textDragCounterRef = useRef(0);

  const extractVideoId = useCallback((input: string): string | null => {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, []);

  const handleContainerDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!onVideoAdded || dragIndexRef.current !== null) return;
      if (!Array.from(e.dataTransfer.types).includes('text/plain')) return;
      textDragCounterRef.current += 1;
      setIsTextDragOver(true);
    },
    [onVideoAdded]
  );

  const handleContainerDragLeave = useCallback(() => {
    if (!onVideoAdded) return;
    textDragCounterRef.current -= 1;
    if (textDragCounterRef.current <= 0) {
      textDragCounterRef.current = 0;
      setIsTextDragOver(false);
    }
  }, [onVideoAdded]);

  const handleContainerDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!onVideoAdded || dragIndexRef.current !== null) return;
      if (!Array.from(e.dataTransfer.types).includes('text/plain')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    [onVideoAdded]
  );

  const handleContainerDrop = useCallback(
    (e: React.DragEvent) => {
      if (!onVideoAdded || dragIndexRef.current !== null) return;
      const text = e.dataTransfer.getData('text/plain');
      if (!text) return;
      const videoId = extractVideoId(text);
      if (!videoId) return;
      e.preventDefault();
      e.stopPropagation();
      textDragCounterRef.current = 0;
      setIsTextDragOver(false);
      onVideoAdded({ id: videoId });
    },
    [onVideoAdded, extractVideoId]
  );

  const handleDragStart = useCallback(
    (index: number, e: React.DragEvent<HTMLDivElement>) => {
      dragIndexRef.current = index;
      e.dataTransfer.effectAllowed = 'move';
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      e.dataTransfer.setDragImage(
        card,
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    },
    []
  );

  const handleDragOver = useCallback(
    (index: number, e: React.DragEvent) => {
      if (!onReorder) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropIndex(index);
    },
    [onReorder]
  );

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      if (
        dragIndexRef.current !== null &&
        dragIndexRef.current !== index &&
        onReorder
      ) {
        onReorder(dragIndexRef.current, index);
      }
      dragIndexRef.current = null;
      setDropIndex(null);
    },
    [onReorder]
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDropIndex(null);
  }, []);

  const getIndexAtPoint = useCallback((x: number, y: number): number | null => {
    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return i;
      }
    }
    return null;
  }, []);

  const handleTouchStart = useCallback(
    (index: number) => {
      if (!onReorder) return;
      touchDragActive.current = false;
      dragIndexRef.current = index;
    },
    [onReorder]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!onReorder || dragIndexRef.current === null) return;
      touchDragActive.current = true;
      e.preventDefault();
      const touch = e.touches[0];
      const idx = getIndexAtPoint(touch.clientX, touch.clientY);
      setDropIndex(idx);
    },
    [onReorder, getIndexAtPoint]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!onReorder || dragIndexRef.current === null) return;
      if (touchDragActive.current) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const toIndex = getIndexAtPoint(touch.clientX, touch.clientY);
        if (toIndex !== null && toIndex !== dragIndexRef.current) {
          onReorder(dragIndexRef.current, toIndex);
        }
      }
      dragIndexRef.current = null;
      touchDragActive.current = false;
      setDropIndex(null);
    },
    [onReorder, getIndexAtPoint]
  );

  const [youtubePermission, setYoutubePermission] = useState(
    () => localStorage.getItem('youtube-permission') !== 'false'
  );

  // Listen for YouTube permission changes
  useEffect(() => {
    const handlePermissionGranted = () => {
      setYoutubePermission(true);
      // Reset tracking so videos get re-fetched with real data
      fetchedOrFetching.current.clear();
      setDetails({});
    };
    const handlePermissionRevoked = () => {
      setYoutubePermission(false);
      fetchedOrFetching.current.clear();
      setDetails({});
    };
    window.addEventListener(
      'youtube-permission-granted',
      handlePermissionGranted
    );
    window.addEventListener(
      'youtube-permission-revoked',
      handlePermissionRevoked
    );
    return () => {
      window.removeEventListener(
        'youtube-permission-granted',
        handlePermissionGranted
      );
      window.removeEventListener(
        'youtube-permission-revoked',
        handlePermissionRevoked
      );
    };
  }, []);

  // Fetch details for all videos (YouTubeAPI rate-limits internally)
  useEffect(() => {
    const toFetch = videos.filter((v) => !fetchedOrFetching.current.has(v.id));
    if (toFetch.length === 0) return;

    const batchIds = new Set(toFetch.map((v) => v.id));

    // Mark as fetching synchronously via ref to prevent duplicate fetches
    batchIds.forEach((id) => fetchedOrFetching.current.add(id));

    if (!youtubePermission) {
      // No permission: populate fallback details immediately without querying YouTube
      setDetails((prev) => {
        const next = { ...prev };
        toFetch.forEach((v) => {
          next[v.id] = {
            id: v.id,
            title: v.id,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            thumbnail: '',
            duration: '0:00',
          };
        });
        return next;
      });
      return;
    }

    setFetchingIds((prev) => new Set([...prev, ...batchIds]));

    // Fetch all in parallel (the API queues and rate-limits requests)
    Promise.all(
      toFetch.map((v) => YouTubeAPI.getVideoDetails(v.id).catch(() => null))
    ).then((results) => {
      setDetails((prev) => {
        const next = { ...prev };
        toFetch.forEach((v, i) => {
          if (results[i]) next[v.id] = results[i]!;
        });
        return next;
      });
      setFetchingIds((prev) => {
        const next = new Set(prev);
        batchIds.forEach((id) => next.delete(id));
        return next;
      });
    });
  }, [videos, youtubePermission]);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(fetchingIds.size > 0);
  }, [fetchingIds, onLoadingChange]);

  return (
    <div
      ref={containerRef}
      className="space-y-6 relative"
      onDragEnter={onVideoAdded ? handleContainerDragEnter : undefined}
      onDragLeave={onVideoAdded ? handleContainerDragLeave : undefined}
      onDragOver={onVideoAdded ? handleContainerDragOver : undefined}
      onDrop={onVideoAdded ? handleContainerDrop : undefined}
    >
      {isTextDragOver && (
        <div className="absolute inset-0 z-20 rounded-2xl border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-primary">
            <span className="text-sm font-medium">Drop to add video</span>
          </div>
        </div>
      )}
      <div
        className={
          layout === 'list'
            ? 'flex flex-col gap-2'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4'
        }
      >
        {onVideoAdded && layout === 'list' && (
          <EmptyVideoCard onVideoAdded={onVideoAdded} layout="list" />
        )}
        {videos.map((video, index) => (
          <div
            key={video.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            draggable={!!onReorder}
            onDragStart={
              onReorder ? (e) => handleDragStart(index, e) : undefined
            }
            onDragOver={onReorder ? (e) => handleDragOver(index, e) : undefined}
            onDrop={onReorder ? (e) => handleDrop(index, e) : undefined}
            onDragEnd={onReorder ? handleDragEnd : undefined}
            onTouchStart={
              onReorder ? (e) => handleTouchStart(index, e) : undefined
            }
            onTouchMove={onReorder ? handleTouchMove : undefined}
            onTouchEnd={onReorder ? handleTouchEnd : undefined}
            className={`rounded-xl transition-all duration-150 ${
              onReorder ? 'cursor-grab active:cursor-grabbing' : ''
            } ${dropIndex === index && dragIndexRef.current !== index ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
          >
            <VideoItem
              video={video}
              videoDetails={details[video.id]}
              layout={layout === 'list' ? 'list' : 'grid'}
              onPlay={onPlay}
              onRemove={onRemove}
              onUpdate={onUpdate}
              loadThumbnails={loadThumbnails}
              enableMaxresThumbnails={enableMaxresThumbnails}
              onSetBackground={onSetBackground}
              currentBackgroundVideoId={currentBackgroundVideoId}
              index={index}
              totalVideos={videos.length}
              onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
              onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}
              ratio={ratio}
            />
          </div>
        ))}
      </div>

      {onVideoAdded && layout !== 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
          <EmptyVideoCard onVideoAdded={onVideoAdded} />
        </div>
      )}
    </div>
  );
});
