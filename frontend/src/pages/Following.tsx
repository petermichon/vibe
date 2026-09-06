import React, { useState, useRef, useEffect } from 'react';
import {
  useSubscriptions,
  type Subscription,
} from '@/contexts/subscriptions-context';
import { useVideo } from '@/contexts/video-context';
import {
  MoreVertical,
  Youtube,
  ExternalLink,
  X,
  Edit,
  Upload,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export function Following() {
  const {
    subscriptions,
    addSubscription,
    removeSubscription,
    updateSubscription,
  } = useSubscriptions();
  const { exportLibrary, importLibrary, addVideo } = useVideo();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null
  );
  const [importFileInfo, setImportFileInfo] = useState<{
    videos: number;
  } | null>(null);
  const [editingChannel, setEditingChannel] = useState<Subscription | null>(
    null
  );
  const [newChannelInput, setNewChannelInput] = useState('');
  const [editChannelInput, setEditChannelInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [redirectPrompt, setRedirectPrompt] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addVideoInputRef = useRef<HTMLInputElement>(null);

  const [backgroundImage, setBackgroundImage] = useState(() => {
    return localStorage.getItem('home-background');
  });
  const [backgroundMode, setBackgroundMode] = useState<'normal' | 'custom'>(
    () => {
      const savedMode = localStorage.getItem('background-mode');
      if (savedMode === 'normal' || savedMode === 'custom') {
        return savedMode;
      }
      return 'custom';
    }
  );

  // Listen for background changes
  useEffect(() => {
    const handleBackgroundChange = () => {
      setBackgroundImage(localStorage.getItem('home-background'));
      const savedMode = localStorage.getItem('background-mode');
      if (savedMode === 'normal' || savedMode === 'custom') {
        setBackgroundMode(savedMode);
      } else {
        setBackgroundMode('custom');
      }
    };
    window.addEventListener('background-changed', handleBackgroundChange);
    return () =>
      window.removeEventListener('background-changed', handleBackgroundChange);
  }, []);

  const parseChannelInput = (
    input: string
  ): { channelId: string; channelUrl: string; channelName: string } | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Check if it's a full YouTube URL
    const urlMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|@)([^/\s]+)/
    );
    if (urlMatch) {
      const identifier = urlMatch[1];
      const channelId = identifier.startsWith('UC') ? identifier : identifier;
      const channelUrl = trimmed.startsWith('http')
        ? trimmed
        : `https://www.youtube.com/${identifier.startsWith('@') ? '' : 'channel/'}${identifier}`;
      return {
        channelId,
        channelUrl,
        channelName: channelId,
      };
    }

    // Check if it's a handle (@channel)
    if (trimmed.startsWith('@')) {
      return {
        channelId: trimmed,
        channelUrl: `https://www.youtube.com/${trimmed}`,
        channelName: trimmed,
      };
    }

    // Check if it's a channel ID (UCxxxxxxxxxxxxxxxxxx)
    if (trimmed.startsWith('UC') && trimmed.length === 24) {
      return {
        channelId: trimmed,
        channelUrl: `https://www.youtube.com/channel/${trimmed}`,
        channelName: trimmed,
      };
    }

    // Treat as a handle or ID
    return {
      channelId: trimmed,
      channelUrl: trimmed.startsWith('@')
        ? `https://www.youtube.com/${trimmed}`
        : `https://www.youtube.com/channel/${trimmed}`,
      channelName: trimmed,
    };
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !Array.from(menuButtonRefs.current.values()).some((btn) =>
          btn.contains(target)
        )
      ) {
        setMenuOpen(null);
      }
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Listen for open add dialog event from bottom nav
  useEffect(() => {
    const handleOpenAddDialog = () => {
      setShowAddDialog(true);
      setTimeout(() => addInputRef.current?.focus(), 50);
    };
    window.addEventListener('open-add-dialog', handleOpenAddDialog);
    return () => {
      window.removeEventListener('open-add-dialog', handleOpenAddDialog);
    };
  }, []);

  const openMenu = (channelId: string) => {
    const btn = menuButtonRefs.current.get(channelId);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const menuWidth = 160;

      // Position menu above the button, aligned to the right
      let left = rect.right - menuWidth;
      const top = rect.top - 4;

      // Ensure menu doesn't go off the left edge of the screen
      if (left < 8) {
        left = 8;
      }

      // Ensure menu doesn't go off the right edge of the screen
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }

      setMenuPosition({ top, left });
    }
    setMenuOpen((prev) => (prev === channelId ? null : channelId));
  };

  const confirmRedirect = () => {
    if (redirectPrompt) {
      window.open(redirectPrompt.url, '_blank', 'noopener,noreferrer');
      setRedirectPrompt(null);
    }
  };

  const handleAddSubmit = () => {
    const parsed = parseChannelInput(newChannelInput);
    if (parsed) {
      // Check if channel already exists
      const exists = subscriptions.some(
        (sub) => sub.channelId === parsed.channelId
      );
      if (exists) {
        setAddError('This channel is already in your list.');
        return;
      }
      addSubscription(parsed);
      setNewChannelInput('');
      setAddError(null);
      setShowAddDialog(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddSubmit();
    if (e.key === 'Escape') {
      setShowAddDialog(false);
      setNewChannelInput('');
      setAddError(null);
    }
  };

  const handleEditSubmit = () => {
    if (!editingChannel) return;
    const parsed = parseChannelInput(editChannelInput);
    if (parsed) {
      // Check if the new channel ID conflicts with another subscription
      const exists = subscriptions.some(
        (sub) =>
          sub.channelId === parsed.channelId &&
          sub.channelId !== editingChannel.channelId
      );
      if (exists) {
        setEditError('This channel is already in your list.');
        return;
      }
      updateSubscription(editingChannel.channelId, parsed);
      setEditChannelInput('');
      setEditError(null);
      setEditingChannel(null);
      setShowEditDialog(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') {
      setShowEditDialog(false);
      setEditChannelInput('');
      setEditError(null);
      setEditingChannel(null);
    }
  };

  const openEditDialog = (subscription: Subscription) => {
    setEditingChannel(subscription);
    setEditChannelInput(subscription.channelUrl);
    setShowEditDialog(true);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleImportLibrary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.videos && Array.isArray(data.videos)) {
          setImportFileInfo({ videos: data.videos.length });
        } else {
          setImportFileInfo(null);
        }
      } catch {
        setImportFileInfo(null);
      }
    };
    reader.readAsText(file);
    setShowImportDialog(true);
  };

  const handleImportSubmit = () => {
    if (!selectedImportFile) return;
    const name = selectedImportFile.name.replace(/\.json$/i, '');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.videos && Array.isArray(data.videos)) {
          importLibrary(data, name);
          setShowImportDialog(false);
          setSelectedImportFile(null);
          setImportFileInfo(null);
        } else {
          alert('Invalid file format');
          return;
        }
      } catch {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(selectedImportFile);
  };

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

  const handleCardClick = (subscription: {
    channelUrl: string;
    channelName: string;
  }) => {
    setRedirectPrompt({
      url: subscription.channelUrl,
      name: subscription.channelName,
    });
  };

  return (
    <div className="relative">
      {backgroundMode === 'custom' && backgroundImage && (
        <div
          className="fixed inset-0"
          style={{
            backgroundImage:
              backgroundImage.startsWith('linear-gradient') ||
              backgroundImage.startsWith('radial-gradient')
                ? backgroundImage
                : `url(${backgroundImage})`,
            backgroundSize:
              backgroundImage?.startsWith('linear-gradient') ||
              backgroundImage?.startsWith('radial-gradient')
                ? 'cover'
                : 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            transition: 'background-image 0.5s ease-in-out',
          }}
        >
          <div
            className="absolute inset-0 backdrop-blur-[100px]"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
      )}

      <div className="relative z-10 md:px-8 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Subscription count */}
          <div className="flex flex-wrap gap-4 items-center justify-between px-4 sm:px-0 py-2">
            <div className="text-sm text-muted-foreground">
              {subscriptions.length}{' '}
              {subscriptions.length === 1 ? 'following' : 'following'}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportLibrary}
            className="hidden"
          />

          {/* Following Grid */}
          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 sm:px-0">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.channelId}
                  className="group relative bg-card/50 backdrop-blur-sm border border-border/20 rounded-xl p-4 hover:bg-card/80 transition-all duration-200 cursor-pointer"
                  onClick={() => handleCardClick(subscription)}
                >
                  {/* Menu button */}
                  <button
                    ref={(el) => {
                      if (el)
                        menuButtonRefs.current.set(subscription.channelId, el);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openMenu(subscription.channelId);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Channel content */}
                  <div className="flex flex-col gap-3">
                    {/* Channel icon placeholder */}
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                      <Youtube className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Channel name */}
                    <h3 className="font-semibold text-center text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {subscription.channelName}
                    </h3>

                    {/* Channel ID */}
                    <div className="text-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {subscription.channelId.startsWith('@')
                          ? subscription.channelId
                          : `@${subscription.channelId}`}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown menu */}
                  {menuOpen === subscription.channelId && (
                    <div
                      ref={menuRef}
                      className="fixed w-40 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-lg z-50 py-1"
                      style={{ top: menuPosition.top, left: menuPosition.left }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(subscription);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSubscription(subscription.channelId);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      <div className="h-16 md:hidden" />

      {/* Redirect confirmation popup */}
      {redirectPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setRedirectPrompt(null);
          }}
        >
          <div
            className="bg-card/90 backdrop-blur-lg border border-border rounded-xl shadow-xl p-6 w-80 max-w-[90vw] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeIn 150ms ease-out' }}
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

      {/* Add Channel Dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setShowAddDialog(false);
            setNewChannelInput('');
          }}
        >
          <div
            className="bg-card/90 backdrop-blur-lg border border-border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeIn 150ms ease-out' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground/80 uppercase tracking-wider">
                Add channel
              </span>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewChannelInput('');
                  setAddError(null);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="add-channel-input"
                  className="text-xs font-medium text-muted-foreground mb-1.5 block"
                >
                  Channel URL, ID, or handle
                </label>
                <input
                  id="add-channel-input"
                  name="add-channel-input"
                  ref={addInputRef}
                  type="text"
                  placeholder="e.g., @channel, UCxxxxxxxxxxxxxxxxxx, or https://www.youtube.com/@channel"
                  value={newChannelInput}
                  onChange={(e) => {
                    setNewChannelInput(e.target.value);
                    setAddError(null);
                  }}
                  onKeyDown={handleAddKeyDown}
                  className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {addError && (
                <p className="text-xs text-muted-foreground">{addError}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewChannelInput('');
                  setAddError(null);
                }}
                className="flex-1 h-10 text-muted-foreground hover:bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                disabled={!newChannelInput.trim()}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Channel Dialog */}
      {showEditDialog && editingChannel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setShowEditDialog(false);
            setEditChannelInput('');
            setEditError(null);
            setEditingChannel(null);
          }}
        >
          <div
            className="bg-card/90 backdrop-blur-lg border border-border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeIn 150ms ease-out' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground/80 uppercase tracking-wider">
                Edit channel
              </span>
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditChannelInput('');
                  setEditError(null);
                  setEditingChannel(null);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="edit-channel-input"
                  className="text-xs font-medium text-muted-foreground mb-1.5 block"
                >
                  Channel URL, ID, or handle
                </label>
                <input
                  id="edit-channel-input"
                  name="edit-channel-input"
                  ref={editInputRef}
                  type="text"
                  placeholder="e.g., @channel, UCxxxxxxxxxxxxxxxxxx, or https://www.youtube.com/@channel"
                  value={editChannelInput}
                  onChange={(e) => {
                    setEditChannelInput(e.target.value);
                    setEditError(null);
                  }}
                  onKeyDown={handleEditKeyDown}
                  className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {editError && (
                <p className="text-xs text-muted-foreground">{editError}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditChannelInput('');
                  setEditError(null);
                  setEditingChannel(null);
                }}
                className="flex-1 h-10 text-muted-foreground hover:bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editChannelInput.trim()}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
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
                id="add-video-input"
                name="add-video-input"
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
              <div>
                <span className="text-sm font-medium text-foreground/80 uppercase tracking-wider">
                  Export Library
                </span>
              </div>
              <button
                onClick={() => setShowExportDialog(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-muted-foreground">
              Export your video library to a JSON file for backup or sharing.
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
                <Upload className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/30 backdrop-blur-sm"
          onClick={() => setShowImportDialog(false)}
        >
          <div
            className="bg-card/90 backdrop-blur-lg border border-border rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeIn 150ms ease-out' }}
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
                <X className="h-5 w-5" />
              </button>
            </div>
            {importFileInfo ? (
              <div className="space-y-4">
                <div className="text-muted-foreground">
                  Found{' '}
                  <span className="font-medium text-foreground">
                    {importFileInfo.videos}
                  </span>{' '}
                  video
                  {importFileInfo.videos !== 1 ? 's' : ''} in the file.
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleImportSubmit()}
                    className="w-full px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
                  >
                    Import as new playlist
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Invalid file format or no videos found.
              </div>
            )}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
