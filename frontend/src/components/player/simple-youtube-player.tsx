import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { LoadingBackground } from './loading-background';

interface SimpleYoutubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  autoPlayEnabled?: boolean;
  loopEnabled?: boolean;
  forcedAspectRatio?: number | null;
}

declare global {
  interface Window {
    YT?: {
      Player: new (...args: unknown[]) => unknown;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const dbg = (...args: unknown[]) => {
  console.log(
    `%c[PlyrDbg]`,
    'color:#00bcd4;font-weight:bold',
    performance.now().toFixed(1),
    ...args
  );
};

let youtubeApiPromise: Promise<void> | null = null;
let apiLoadId = 0;

function ensureYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    dbg('ensureYouTubeApi: YT already loaded, resolving immediately');
    return Promise.resolve();
  }
  if (youtubeApiPromise) {
    dbg('ensureYouTubeApi: returning cached promise');
    return youtubeApiPromise;
  }
  const id = ++apiLoadId;
  dbg(`ensureYouTubeApi: injecting iframe_api script (load#${id})`, {
    hasPreviousCallback: typeof window.onYouTubeIframeAPIReady === 'function',
  });
  youtubeApiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      dbg(`ensureYouTubeApi: onYouTubeIframeAPIReady fired (load#${id})`, {
        hasYT: !!window.YT,
        hasPlayer: !!window.YT?.Player,
      });
      if (typeof previous === 'function') previous();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onload = () => {
      dbg(`ensureYouTubeApi: script onload fired (load#${id})`, {
        hasYT: !!window.YT,
        hasPlayer: !!window.YT?.Player,
      });
    };
    tag.onerror = () => {
      dbg(`ensureYouTubeApi: script onerror fired (load#${id})`);
      youtubeApiPromise = null;
      reject(new Error('Failed to load YouTube API'));
    };
    document.head.appendChild(tag);
  });
  return youtubeApiPromise;
}

export function SimpleYoutubePlayer({
  videoId,
  onReady,
  onError,
  autoPlayEnabled = false,
  loopEnabled = false,
  forcedAspectRatio,
}: SimpleYoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const mountIdRef = useRef(0);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const mountId = ++mountIdRef.current;
    dbg(`effect RUN mount#${mountId}`, {
      videoId,
      autoPlayEnabled,
      loopEnabled,
      forcedAspectRatio,
      retryKey,
      hasContainer: !!containerRef.current,
      hasPlayer: !!playerRef.current,
      hasYT: !!window.YT,
    });

    if (!videoId || !containerRef.current) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    setIsLoading(true);
    setError(null);

    const init = async () => {
      dbg(`init START mount#${mountId}`, { videoId, cancelled });
      try {
        await ensureYouTubeApi();
      } catch (err) {
        dbg(`init FAILED ensureYouTubeApi mount#${mountId}`, err, {
          cancelled,
        });
        if (!cancelled) {
          console.error('YouTube API load error:', err);
          setError('Failed to load YouTube API');
          setIsLoading(false);
          if (onErrorRef.current) onErrorRef.current(err as Error);
        }
        return;
      }
      dbg(`init AFTER ensureYouTubeApi mount#${mountId}`, {
        cancelled,
        hasContainer: !!containerRef.current,
        hasYT: !!window.YT,
      });

      if (cancelled || !containerRef.current) {
        dbg(`init ABORTED after await mount#${mountId}`, { cancelled });
        return;
      }

      // Create the HTML structure for Plyr YouTube
      dbg(`init injecting innerHTML mount#${mountId}`, { videoId });
      containerRef.current.innerHTML = `
        <div 
          class="plyr__video-embed" 
          data-plyr-provider="youtube" 
          data-plyr-embed-id="${videoId}"
          style="${forcedAspectRatio ? `aspect-ratio: ${forcedAspectRatio} !important;` : ''}"
        >
          <iframe 
            src="https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;autohide=1&amp;wmode=opaque&amp;autoplay=${autoPlayEnabled ? 1 : 0}" 
            allowfullscreen
            allowtransparency
            allow="autoplay"
            style="${forcedAspectRatio ? `aspect-ratio: ${forcedAspectRatio} !important;` : ''}"
          ></iframe>
        </div>
      `;

      try {
        const playerElement =
          containerRef.current.querySelector('.plyr__video-embed');
        if (!playerElement) {
          throw new Error('Player element not found');
        }
        dbg(`init creating new Plyr mount#${mountId}`, {
          playerElement: playerElement.tagName,
        });

        // Initialize Plyr with npm package
        const player = new Plyr(playerElement as HTMLElement, {
          autoplay: autoPlayEnabled,
          muted: autoPlayEnabled,
          loop: { active: loopEnabled },
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'airplay',
            'fullscreen',
          ],
          youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
          },
          ratio: forcedAspectRatio ? `${forcedAspectRatio}:1` : null,
        });

        playerRef.current = player;
        dbg(`init Plyr created mount#${mountId}`, {
          containerInner: containerRef.current.innerHTML.slice(0, 200),
          hasPlyrClass: !!containerRef.current.querySelector('.plyr'),
          iframeSrc: containerRef.current
            .querySelector('iframe')
            ?.getAttribute('src'),
        });

        const plyrContainer = (
          player as unknown as { elements?: { container?: Element } }
        ).elements?.container;
        if (plyrContainer) {
          const onRawState = (e: Event) => {
            const detail = (e as CustomEvent).detail as
              { code?: unknown } | undefined;
            dbg(`statechange(RAW DOM) mount#${mountId}`, {
              code: detail?.code,
            });
          };
          plyrContainer.addEventListener('statechange', onRawState);
          cleanups.push(() =>
            plyrContainer.removeEventListener('statechange', onRawState)
          );
          dbg(`init attached RAW DOM statechange listener mount#${mountId}`, {
            containerClass: plyrContainer.className,
          });
        } else {
          dbg(`init NO player.elements.container mount#${mountId}`);
        }

        const mediaEl = (player as unknown as { media?: Element }).media;
        dbg(`init player.media mount#${mountId}`, {
          mediaTag: mediaEl?.tagName,
          mediaId: mediaEl?.id,
        });

        const proxyEvents = [
          'loadstart',
          'loadeddata',
          'loadedmetadata',
          'canplay',
          'canplaythrough',
          'waiting',
          'playing',
          'timeupdate',
          'progress',
          'durationchange',
          'seeked',
        ];
        proxyEvents.forEach((type) => {
          player.on(type as never, (event: unknown) => {
            dbg(`media:${type} mount#${mountId}`, {
              detail: (event as CustomEvent).detail,
            });
          });
        });

        // Apply forced aspect ratio after Plyr initializes
        if (forcedAspectRatio) {
          const plyrElement = containerRef.current.querySelector('.plyr');
          if (plyrElement) {
            (plyrElement as HTMLElement).style.aspectRatio =
              `${forcedAspectRatio}`;
            (plyrElement as HTMLElement).style.height = '100%';
            (plyrElement as HTMLElement).style.width = '100%';
          }
          const embedElement =
            containerRef.current.querySelector('.plyr__video-embed');
          if (embedElement) {
            (embedElement as HTMLElement).style.aspectRatio =
              `${forcedAspectRatio}`;
            (embedElement as HTMLElement).style.height = '100%';
            (embedElement as HTMLElement).style.width = '100%';
            const iframe = embedElement.querySelector('iframe');
            if (iframe) {
              (iframe as HTMLElement).style.aspectRatio =
                `${forcedAspectRatio}`;
              (iframe as HTMLElement).style.height = '100%';
              (iframe as HTMLElement).style.width = '100%';
            }
          }
        }

        let coverHidden = false;
        const hideLoading = () => {
          dbg(`hideLoading mount#${mountId}`);
          coverHidden = true;
          setIsLoading(false);
          if (onReadyRef.current) onReadyRef.current();
        };

        const probes: number[] = [];
        const probe = () => {
          if (coverHidden) {
            probes.forEach((id) => clearInterval(id));
            return;
          }
          const embed = (
            player as unknown as {
              embed?: {
                getPlayerState?: () => number;
                getVideoLoadedFraction?: () => number;
                getCurrentTime?: () => number;
                getDuration?: () => number;
              };
            }
          ).embed;
          const state = embed?.getPlayerState?.();
          dbg(`probe mount#${mountId}`, {
            embed: !!embed,
            playerState: state,
            loadedFraction: embed?.getVideoLoadedFraction?.(),
            currentTime: embed?.getCurrentTime?.(),
            duration: embed?.getDuration?.(),
          });
          if (state === -1 || state === 5 || state === 1) {
            hideLoading();
          }
        };
        probes.push(window.setInterval(probe, 500));
        cleanups.push(() => probes.forEach((id) => clearInterval(id)));

        // Plyr's 'ready' fires when the YouTube API reports the player is
        // initialized, before the first frame is actually painted in the embed.
        // Hiding the loading cover then causes a flash of the bare Plyr chrome
        // followed by the YouTube content. Instead, hide once the video content
        // is actually rendered (unstarted/cued => poster shown) or playing.
        player.on('statechange', (event) => {
          dbg(`statechange mount#${mountId}`, {
            code: event.detail.code,
            stateName:
              {
                '-1': 'UNSTARTED',
                '0': 'ENDED',
                '1': 'PLAYING',
                '2': 'PAUSED',
                '3': 'BUFFERING',
                '5': 'CUED',
              }[String(event.detail.code)] ?? 'UNKNOWN',
          });
          if (event.detail.code === -1 || event.detail.code === 5) {
            hideLoading();
          }
        });
        player.on('playing', () => {
          dbg(`playing mount#${mountId}`);
          hideLoading();
        });
        player.on('ready', () => {
          dbg(`ready mount#${mountId} (Plyr ready) - NOT hiding loading`);
          const fallback = window.setTimeout(() => {
            if (coverHidden) return;
            dbg(
              `FALLBACK: ready+5s elapsed, cover still up - force hiding mount#${mountId}`
            );
            hideLoading();
          }, 5000);
          cleanups.push(() => clearTimeout(fallback));
        });

        player.on('error', (err) => {
          dbg(`error mount#${mountId}`, err);
          console.error('Plyr player error:', err);
          setError('Failed to load video');
          setIsLoading(false);
          if (onErrorRef.current) onErrorRef.current(err as Error);
        });
      } catch (err) {
        dbg(`init caught error mount#${mountId}`, err, { cancelled });
        if (!cancelled) {
          console.error('Plyr initialization error:', err);
          setError('Failed to initialize player');
          setIsLoading(false);
          if (onErrorRef.current) onErrorRef.current(err as Error);
        }
      }
    };

    init();

    // Cleanup
    return () => {
      dbg(`effect CLEANUP mount#${mountId}`, {
        hadPlayer: !!playerRef.current,
        cancelled,
        cleanupCount: cleanups.length,
      });
      cancelled = true;
      cleanups.forEach((fn) => fn());
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          dbg(`effect CLEANUP destroyed player mount#${mountId}`);
        } catch (err) {
          console.warn('Plyr cleanup error:', err);
        }
        playerRef.current = null;
      }
    };
  }, [videoId, autoPlayEnabled, loopEnabled, forcedAspectRatio, retryKey]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <LoadingBackground videoId={videoId} isLoading={isLoading} />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center text-white">
            <p className="mb-2">{error}</p>
            <button
              onClick={() => {
                dbg(`retry clicked (old retryKey=${retryKey})`);
                setRetryKey((k) => k + 1);
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          minHeight: '200px',
          aspectRatio: forcedAspectRatio || undefined,
        }}
      />
    </div>
  );
}
