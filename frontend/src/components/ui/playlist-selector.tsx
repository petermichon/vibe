import { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Plus, Upload, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideo } from '@/contexts/video-context';

interface PlaylistSelectorProps {
  onImportClick: () => void;
}

interface AddMenuState {
  x: number;
  y: number;
}

export function PlaylistSelector({ onImportClick }: PlaylistSelectorProps) {
  const {
    playlists,
    activePlaylistId,
    setActivePlaylist,
    removePlaylist,
    renamePlaylist,
    updatePlaylistRatio,
    createBlankPlaylist,
    exportLibrary,
  } = useVideo();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [addMenu, setAddMenu] = useState<AddMenuState | null>(null);
  const [globalMenu, setGlobalMenu] = useState<{
    right: number;
    top: number;
  } | null>(null);
  const [renaming, setRenaming] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const globalMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!addMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setAddMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [addMenu]);

  useEffect(() => {
    if (!globalMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        globalMenuRef.current &&
        !globalMenuRef.current.contains(e.target as Node)
      ) {
        setGlobalMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [globalMenu]);

  useEffect(() => {
    if (renaming) {
      setTimeout(() => renameInputRef.current?.focus(), 30);
    }
  }, [renaming]);

  const openGlobalMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setGlobalMenu({
      right: window.innerWidth - rect.right,
      top: rect.bottom + 4,
    });
  };

  const openAddMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAddMenu({ x: rect.left, y: rect.bottom + 4 });
  };

  const handleImportFromMenu = () => {
    setAddMenu(null);
    onImportClick();
  };

  const handleCreateBlank = () => {
    setAddMenu(null);
    const name = `Playlist ${playlists.length + 1}`;
    createBlankPlaylist(name);
  };

  const openAddVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-add-dialog'));
  };

  const commitRename = useCallback(() => {
    if (!renaming) return;
    const trimmed = renaming.value.trim();
    if (!trimmed) {
      setRenaming(null);
      return;
    }
    renamePlaylist(renaming.id, trimmed);
    setRenaming(null);
  }, [renaming, renamePlaylist]);

  const confirmDelete = useCallback(() => {
    if (!deletePrompt) return;
    removePlaylist(deletePrompt);
    setDeletePrompt(null);
  }, [deletePrompt, removePlaylist]);

  const handleGlobalRatioChange = useCallback(
    (ratio: '16:9' | '1:1') => {
      if (!activePlaylistId) return;
      updatePlaylistRatio(activePlaylistId, ratio);
      setGlobalMenu(null);
    },
    [activePlaylistId, updatePlaylistRatio]
  );

  const handleGlobalRename = useCallback(() => {
    if (!activePlaylistId) return;
    const playlist = playlists.find((p) => p.id === activePlaylistId);
    if (playlist) {
      setRenaming({ id: playlist.id, value: playlist.name });
      setGlobalMenu(null);
    }
  }, [activePlaylistId, playlists]);

  const handleGlobalExport = useCallback(() => {
    exportLibrary();
    setGlobalMenu(null);
  }, [exportLibrary]);

  const handleGlobalDelete = useCallback(() => {
    if (!activePlaylistId) return;
    setDeletePrompt(activePlaylistId);
    setGlobalMenu(null);
  }, [activePlaylistId]);

  return (
    <>
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto scrollbar-none pb-0.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {playlists.map((playlist) => {
          const isActive = playlist.id === activePlaylistId;
          return (
            <div
              key={playlist.id}
              className={cn(
                'flex-shrink-0 flex items-center gap-0.5 rounded-full transition-colors duration-150',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {renaming?.id === playlist.id ? (
                <input
                  ref={renameInputRef}
                  value={renaming.value}
                  onChange={(e) =>
                    setRenaming({ ...renaming, value: e.target.value })
                  }
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenaming(null);
                  }}
                  className={cn(
                    'px-3 py-1 text-sm font-medium bg-transparent border-none outline-none w-32 text-foreground'
                  )}
                />
              ) : (
                <button
                  onClick={() => setActivePlaylist(playlist.id)}
                  className="px-3 py-1 text-sm font-medium bg-transparent border-none cursor-pointer whitespace-nowrap"
                >
                  {playlist.name}
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={openAddMenu}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150 border-none cursor-pointer"
          title="Add playlist"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={openAddVideo}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150 border-none cursor-pointer ml-auto"
          title="Add video"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={openGlobalMenu}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150 border-none cursor-pointer"
          title="Playlist settings"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {addMenu && (
        <div
          ref={addMenuRef}
          className="fixed z-[300] min-w-[140px] rounded-lg border border-border bg-card/90 backdrop-blur-md shadow-lg py-1"
          style={{
            top: addMenu.y,
            left: addMenu.x,
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <button
            onClick={handleImportFromMenu}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            <Download className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={handleCreateBlank}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Create blank
          </button>
        </div>
      )}

      {globalMenu && (
        <div
          ref={globalMenuRef}
          className="fixed z-[300] min-w-[140px] rounded-lg border border-border bg-card/90 backdrop-blur-md shadow-lg py-1"
          style={{
            top: globalMenu.top,
            right: globalMenu.right,
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <button
            onClick={handleGlobalRename}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            <Pencil className="h-4 w-4" />
            Rename
          </button>
          <button
            onClick={handleGlobalExport}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            <Upload className="h-4 w-4" />
            Export
          </button>
          <div className="px-3 py-1.5 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium">
              Ratio
            </span>
          </div>
          <button
            onClick={() => handleGlobalRatioChange('16:9')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            <span className="text-xs">16:9</span>
          </button>
          <button
            onClick={() => handleGlobalRatioChange('1:1')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            <span className="text-xs">1:1</span>
          </button>
          <button
            onClick={handleGlobalDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}

      {deletePrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setDeletePrompt(null);
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
                  Delete playlist?
                </span>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {playlists.find((p) => p.id === deletePrompt)?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {
                      playlists.find((p) => p.id === deletePrompt)?.videos
                        .length
                    }{' '}
                    video
                    {playlists.find((p) => p.id === deletePrompt)?.videos
                      .length !== 1
                      ? 's'
                      : ''}
                  </span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                Are you sure you want to delete this playlist? This action
                cannot be undone.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletePrompt(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
