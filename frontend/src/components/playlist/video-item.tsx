import { memo, useState, useRef, useEffect } from 'react';
import {
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Copy,
  Check as CheckIcon,
  ImagePlay,
  GripVertical,
  Youtube,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThumbnailQuality } from '@/hooks/use-thumbnail-quality';
import { getYouTubeThumbnailUrl } from '@/lib/color-extractor';
import type { YouTubeVideoDetails } from '@/services/youtube-api';
import type { Video } from '@/types/index';

type LayoutMode = 'grid' | 'list';

interface VideoItemProps {
  video: Video;
  videoDetails?: YouTubeVideoDetails;
  layout: LayoutMode;
  onPlay: (video: Video) => void;
  onRemove?: (videoId: string) => void;
  onUpdate?: (videoId: string, updates: Partial<Video>) => void;
  loadThumbnails?: boolean;
  enableMaxresThumbnails?: boolean;
  onSetBackground?: (videoId: string) => void;
  currentBackgroundVideoId?: string | null;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  index?: number;
  totalVideos?: number;
  ratio?: '16:9' | '1:1';
}

export const VideoItem = memo(function VideoItem({
  video,
  videoDetails,
  layout,
  onPlay,
  onRemove,
  onUpdate,
  loadThumbnails = true,
  enableMaxresThumbnails = true,
  onSetBackground,
  currentBackgroundVideoId,
  onMoveUp,
  onMoveDown,
  index = 0,
  totalVideos = 0,
  ratio = '16:9',
}: VideoItemProps) {
  // Check if this is fallback data (no real YouTube details)
  const isFallbackData =
    !videoDetails?.title || videoDetails.title === video.id;
  const thumbnailQuality = useThumbnailQuality(
    video.id,
    enableMaxresThumbnails && !isFallbackData
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editVideoId, setEditVideoId] = useState(video.id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [redirectPrompt, setRedirectPrompt] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [removePrompt, setRemovePrompt] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuthorClick = (
    e: React.MouseEvent,
    url: string,
    name: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setRedirectPrompt({ url, name });
  };

  const confirmRedirect = () => {
    if (redirectPrompt) {
      window.open(redirectPrompt.url, '_blank', 'noopener,noreferrer');
      setRedirectPrompt(null);
    }
  };

  if (!videoDetails) {
    return (
      <div className={ratio === '1:1' ? 'aspect-square' : 'aspect-video'} />
    );
  }

  const details = videoDetails;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditVideoId(video.id);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate(video.id, {
        id: editVideoId,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditVideoId(video.id);
    setIsEditing(false);
  };

  const handleCopyVideoId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.id);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovePrompt(true);
    setMenuOpen(false);
  };

  const confirmRemove = () => {
    onRemove(video.id);
    setRemovePrompt(false);
  };

  // Layout-specific classes
  const containerClasses = `group ${isEditing ? 'cursor-default' : 'cursor-pointer'}`;

  const thumbnailClasses =
    layout === 'grid'
      ? `${ratio === '1:1' ? 'aspect-square' : 'aspect-video'} relative overflow-hidden shadow-lg rounded-lg sm:rounded-xl`
      : `relative w-20 sm:w-28 md:w-40 lg:w-48 ${ratio === '1:1' ? 'aspect-square' : 'aspect-video'} overflow-hidden flex-shrink-0 shadow-lg rounded-lg sm:rounded-xl`;

  const contentClasses =
    layout === 'grid'
      ? 'px-3 sm:px-4 py-2'
      : 'flex-1 min-w-0 flex flex-col justify-center px-2 sm:px-0';

  const titleClasses =
    layout === 'grid'
      ? 'font-semibold text-sm sm:text-base leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors'
      : 'font-semibold text-xs sm:text-sm md:text-base leading-snug text-card-foreground line-clamp-1 group-hover:text-primary transition-colors';

  return (
    <div
      className={containerClasses}
      onClick={() => {
        if (!isEditing) {
          onPlay(video);
        }
      }}
    >
      {/* Redirect confirmation popup */}
      {redirectPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setRedirectPrompt(null);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl p-6 w-80 max-w-[90vw] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-white" />
                <span className="font-semibold text-foreground text-base">
                  Opening YouTube
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                You're about to visit{' '}
                <span className="font-medium text-foreground">
                  {redirectPrompt.name}
                </span>
                's channel on YouTube.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRedirectPrompt(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRedirect}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Remove confirmation popup */}
      {removePrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setRemovePrompt(false);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl p-6 w-96 max-w-[90vw] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-foreground text-base">
                  Remove video?
                </span>
              </div>
              <div className="flex gap-3">
                <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  {loadThumbnails && !isFallbackData ? (
                    <img
                      src={getYouTubeThumbnailUrl(video.id, thumbnailQuality)}
                      alt={details.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30" />
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-medium text-foreground line-clamp-2">
                    {details.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {details.author_name}
                  </span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                Are you sure you want to remove this video from your playlist?
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRemovePrompt(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {layout === 'grid' ? (
        // Grid Layout
        <>
          {/* Thumbnail Container */}
          <div className={thumbnailClasses}>
            {loadThumbnails && !isFallbackData ? (
              <img
                src={getYouTubeThumbnailUrl(video.id, thumbnailQuality)}
                alt={details.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/30" />
            )}
          </div>

          {/* Content Section */}
          <div className={contentClasses + ' relative overflow-visible'}>
            {isEditing ? (
              /* Edit Form */
              <div
                className="py-4 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Video ID */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Video ID
                  </label>
                  <input
                    type="text"
                    value={editVideoId}
                    onChange={(e) => setEditVideoId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-ring"
                  />
                </div>

                {/* Edit Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="flex-1 h-8"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex-1 h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="py-4 space-y-3 min-h-[120px]">
                {/* Title */}
                {!isFallbackData && details?.title ? (
                  <h3 className={titleClasses}>{details.title}</h3>
                ) : (
                  <div className="h-[2.75rem] bg-muted/30 rounded" />
                )}

                {/* Author & Video ID */}
                <div className="flex items-center gap-2 min-w-0">
                  {!isFallbackData && details?.author_name ? (
                    <>
                      {details?.author_url ? (
                        <a
                          href={details.author_url}
                          onClick={(e) =>
                            handleAuthorClick(
                              e,
                              details.author_url!,
                              details.author_name!
                            )
                          }
                          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate min-w-0 cursor-pointer"
                        >
                          <span className="truncate">
                            {details.author_name}
                          </span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground truncate min-w-0">
                          {details.author_name}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="h-4 w-24 bg-muted/30 rounded" />
                  )}
                  {/* Vertical ellipsis menu button */}
                  <div className="relative ml-auto" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                      }}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {/* Dropdown menu */}
                    {menuOpen && (
                      <div className="absolute right-0 bottom-full mb-1 bg-card/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl min-w-[180px] z-50">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyVideoId(e);
                            }}
                            className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                          >
                            {copiedId === video.id ? (
                              <CheckIcon className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <Copy className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="font-mono">{video.id}</span>
                          </button>
                          {onSetBackground && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetBackground(video.id);
                                setMenuOpen(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <ImagePlay className="h-4 w-4" />
                              <span>
                                {currentBackgroundVideoId === video.id
                                  ? 'Remove Wallpaper'
                                  : 'Wallpaper'}
                              </span>
                            </button>
                          )}
                          {onUpdate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(e);
                                setMenuOpen(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                          )}
                          {onRemove && (
                            <button
                              onClick={handleRemoveClick}
                              className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // List Layout
        <div className="flex gap-2 sm:gap-3 md:gap-5 items-center rounded-xl px-2 min-w-0 overflow-hidden transition-shadow duration-150 hover:shadow-md group-hover:bg-accent/5">
          {/* Drag handle */}
          <GripVertical className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
          {/* Thumbnail */}
          <div className={`${thumbnailClasses} relative`}>
            {loadThumbnails && !isFallbackData ? (
              <img
                src={getYouTubeThumbnailUrl(video.id, thumbnailQuality)}
                alt={details.title}
                loading="lazy"
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full bg-muted/30" />
            )}
            {onSetBackground && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetBackground(video.id);
                }}
                className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all duration-150 border-none cursor-pointer ${
                  currentBackgroundVideoId === video.id
                    ? 'opacity-100 bg-primary text-primary-foreground'
                    : 'opacity-0 group-hover:opacity-100 bg-black/50 text-white hover:bg-black/70'
                }`}
                title={
                  currentBackgroundVideoId === video.id
                    ? 'Remove Wallpaper'
                    : 'Wallpaper'
                }
              >
                <ImagePlay className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className={contentClasses}>
            {isEditing ? (
              /* Edit Form */
              <div className="" onClick={(e) => e.stopPropagation()}>
                {/* Video ID */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-muted-foreground block">
                    Video ID
                  </label>
                  <input
                    type="text"
                    value={editVideoId}
                    onChange={(e) => setEditVideoId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-ring"
                  />
                </div>

                {/* Edit Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="flex-1 h-9"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex-1 h-9"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                <div className="space-y-2 min-w-0">
                  {!isFallbackData && details?.title ? (
                    <h3 className={titleClasses}>{details.title}</h3>
                  ) : (
                    <div className="h-6 bg-muted/30 rounded" />
                  )}

                  {/* Author & Video ID */}
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {!isFallbackData && details?.author_name ? (
                      <>
                        {details?.author_url ? (
                          <a
                            href={details.author_url}
                            onClick={(e) =>
                              handleAuthorClick(
                                e,
                                details.author_url!,
                                details.author_name!
                              )
                            }
                            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <span className="truncate">
                              {details.author_name}
                            </span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 flex-1 truncate">
                            {details.author_name}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="h-4 w-24 bg-muted/30 rounded flex-1" />
                    )}
                    <div
                      className="hidden sm:flex items-center gap-1 group/video-id hover:text-foreground transition-colors cursor-pointer flex-shrink-0 min-w-0"
                      onClick={handleCopyVideoId}
                    >
                      <span className="text-xs sm:text-sm text-muted-foreground font-mono group-hover/video-id:text-foreground truncate">
                        {video.id}
                      </span>
                      {copiedId === video.id ? (
                        <CheckIcon className="h-3 w-3 text-foreground flex-shrink-0" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground group-hover/video-id:text-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onMoveUp && index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveUp();
                        }}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                    {onMoveDown && index < totalVideos - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveDown();
                        }}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {(onUpdate || onRemove) && (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleStartEdit}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all"
                          aria-label="Edit video"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(video.id);
                          }}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          aria-label="Remove video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
