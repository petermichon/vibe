import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVideo } from '@/contexts/video-context';
import { VideoContainer } from '@/components/playlist/video-container';
import { ChevronDown, Upload, Download, X } from 'lucide-react';
import { PlaylistSelector } from '@/components/ui/playlist-selector';
import { YouTubePermissionBanner } from '@/components/ui/youtube-permission-banner';
import { VideoEmptyState } from '@/components/ui/empty-state';
import { YouTubeAPI } from '@/services/youtube-api';
import type { Video } from '@/types/index';

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addVideo,
    removeVideo,
    exportLibrary,
    importLibrary,
    videos,
    activePlaylist,
  } = useVideo();
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const [youtubePermission, setYoutubePermission] = useState(() => {
    const saved = localStorage.getItem('youtube-permission');
    if (saved === null) {
      localStorage.setItem('youtube-permission', 'true');
      return true;
    }
    return saved === 'true';
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null
  );
  const [importFileInfo, setImportFileInfo] = useState<{
    videos: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const addVideoInputRef = useRef<HTMLInputElement>(null);

  const reversedVideos = useMemo(() => [...videos].reverse(), [videos]);

  // Listen for YouTube permission changes
  useEffect(() => {
    const handleGranted = () => setYoutubePermission(true);
    const handleRevoked = () => setYoutubePermission(false);
    window.addEventListener('youtube-permission-granted', handleGranted);
    window.addEventListener('youtube-permission-revoked', handleRevoked);
    return () => {
      window.removeEventListener('youtube-permission-granted', handleGranted);
      window.removeEventListener('youtube-permission-revoked', handleRevoked);
    };
  }, []);

  // Listen for open add dialog event from bottom nav
  useEffect(() => {
    const handleOpenAddDialog = () => {
      setShowAddVideoDialog(true);
      setTimeout(() => addVideoInputRef.current?.focus(), 50);
    };
    window.addEventListener('open-add-dialog', handleOpenAddDialog);
    return () => {
      window.removeEventListener('open-add-dialog', handleOpenAddDialog);
    };
  }, []);

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleGrantPermission = () => {
    setYoutubePermission(true);
    localStorage.setItem('youtube-permission', 'true');
    YouTubeAPI.clearCache();
    window.dispatchEvent(new CustomEvent('youtube-permission-granted'));
  };

  const handleImportLibrary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedImportFile(file);

    event.target.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.videos || !Array.isArray(data.videos)) {
          setImportFileInfo(null);
          return;
        }

        setImportFileInfo({
          videos: data.videos.length,
        });
      } catch {
        setImportFileInfo(null);
      }
    };
    reader.readAsText(file);
    setShowImportDialog(true);
  };

  const handleSelectorImportClick = () => {
    fileInputRef2.current?.click();
  };

  const handleSelectorImportFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name.replace(/\.json$/i, '');
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.videos || !Array.isArray(data.videos)) return;
        importLibrary(data, name);
      } catch {
        /* ignore */
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!selectedImportFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.videos || !Array.isArray(data.videos)) {
          alert('Invalid file format');
          return;
        }

        const name = selectedImportFile.name.replace(/\.json$/i, '');
        importLibrary(data, name);
        setShowImportDialog(false);
        setSelectedImportFile(null);
        setImportFileInfo(null);
      } catch {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(selectedImportFile);
  };

  const handlePlayVideo = useCallback(
    (video: Video) => {
      navigate('/player', { state: { video } });
    },
    [navigate]
  );

  const handleRemoveVideo = useCallback(
    (videoId: string) => {
      removeVideo(videoId);
    },
    [removeVideo]
  );

  const extractVideoId = (url: string): string | null => {
    const rawIdMatch = url.match(/^[a-zA-Z0-9_-]{11}$/);
    if (rawIdMatch) return rawIdMatch[0];
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddVideoSubmit = () => {
    const videoId = extractVideoId(newVideoUrl.trim());
    if (videoId) {
      addVideo({ id: videoId });
      setNewVideoUrl('');
      setShowAddVideoDialog(false);
    }
  };

  const handleAddVideoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddVideoSubmit();
    if (e.key === 'Escape') {
      setShowAddVideoDialog(false);
      setNewVideoUrl('');
    }
  };

  const currentBackgroundVideoId = (() => {
    const bg = localStorage.getItem('home-background');
    return bg ? (bg.match(/\/vi\/([^/]+)\//)?.[1] ?? null) : null;
  })();

  const handleSetBackground = useCallback(
    (videoId: string) => {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      if (currentBackgroundVideoId === videoId) {
        localStorage.removeItem('home-background');
      } else {
        localStorage.setItem('home-background', thumbnailUrl);
      }
      window.dispatchEvent(new CustomEvent('background-changed'));
    },
    [currentBackgroundVideoId]
  );

  return (
    <div className="relative">
      <div className="relative z-10 md:px-8 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Playlist Selector */}
          <div className="mb-3 px-4 sm:px-0">
            <PlaylistSelector onImportClick={handleSelectorImportClick} />
          </div>

          {/* YouTube Permission Banner */}
          {!youtubePermission && (
            <YouTubePermissionBanner onAllow={handleGrantPermission} />
          )}

          {/* Videos Grid */}
          <div className="transition-all duration-300">
            <VideoContainer
              videos={reversedVideos}
              onPlay={handlePlayVideo}
              onRemove={handleRemoveVideo}
              layout="grid"
              enableMaxresThumbnails={true}
              onSetBackground={handleSetBackground}
              ratio={activePlaylist?.ratio ?? '16:9'}
              currentBackgroundVideoId={currentBackgroundVideoId}
            />
          </div>

          {/* Empty State */}
          {videos.length === 0 && <VideoEmptyState />}
        </div>
      </div>
      <div className="h-16 md:hidden" />

      {/* Export Dialog */}
      {showExportDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/30 backdrop-blur-sm"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="bg-card/80 backdrop-blur-lg border border-border rounded-lg shadow-lg max-w-sm w-full p-3 space-y-4 pointer-events-auto text-sm"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-foreground/80" />
                <span className="text-sm font-medium text-foreground/80 uppercase tracking-wider">
                  Export Library
                </span>
              </div>
              <button
                onClick={() => setShowExportDialog(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground leading-relaxed text-sm">
                The following will be exported:
              </p>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Videos:</span>
                  <span className="font-medium">{videos.length}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowExportDialog(false)}
                className="flex-1 h-8 text-muted-foreground hover:bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  exportLibrary();
                  setShowExportDialog(false);
                }}
                className="flex-1 h-8 text-muted-foreground hover:bg-transparent border-none cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto bg-background/50 shadow-2xl transition-opacity duration-200"
          onClick={() => setShowImportDialog(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Import Library
              </h3>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setSelectedImportFile(null);
                  setImportFileInfo(null);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <ChevronDown className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="space-y-2">
              {selectedImportFile && importFileInfo ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    The file contains:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        File:
                      </span>
                      <p className="text-sm font-medium truncate ml-2">
                        {selectedImportFile.name}
                      </p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Videos:</span>
                      <span className="font-medium">
                        {importFileInfo.videos}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Invalid file format or unable to read file.
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setSelectedImportFile(null);
                  setImportFileInfo(null);
                }}
                className="flex-1 px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              {selectedImportFile && importFileInfo && (
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none cursor-pointer"
                >
                  Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Video Dialog */}
      {showAddVideoDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setShowAddVideoDialog(false);
            setNewVideoUrl('');
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card/95 backdrop-blur-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeIn 150ms ease-out' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span className="text-sm font-medium text-foreground">
                Add video
              </span>
              <button
                onClick={() => {
                  setShowAddVideoDialog(false);
                  setNewVideoUrl('');
                }}
                className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-5">
              <input
                ref={addVideoInputRef}
                type="text"
                placeholder="Paste a YouTube URL or video ID"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyDown={handleAddVideoKeyDown}
                autoFocus
                className="w-full h-11 px-4 rounded-xl border border-border/60 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => {
                  setShowAddVideoDialog(false);
                  setNewVideoUrl('');
                }}
                className="flex-1 h-10 rounded-xl text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideoSubmit}
                disabled={!extractVideoId(newVideoUrl.trim())}
                className="flex-1 h-10 rounded-xl text-sm font-medium text-foreground hover:bg-foreground/10 transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportLibrary}
        className="hidden"
      />
      <input
        ref={fileInputRef2}
        type="file"
        accept=".json"
        onChange={handleSelectorImportFile}
        className="hidden"
      />
    </div>
  );
}
