import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Clock, RotateCw } from "lucide-react";

// Utility functions
const formatTime = (seconds) => {
  const secs = seconds % 60;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
const getColor = (timeLeft, inDelay) => {
  if (inDelay) return "#3B82F6";
  if (timeLeft <= 20) return "#EF4444";
  return "#10B981";
};

// Timer overlay (rectangular, compact)
const TimerOverlay = ({ timeLeft, totalTime, inDelay = false }) => {
  const percentage = (timeLeft / totalTime) * 100;
  return (
    <div
      className="flex flex-col items-center justify-center gap-1"
      style={{ width: "120px", minWidth: "100px", maxWidth: "140px" }}
    >
      <div
        className="relative w-full h-16 rounded-lg border-2 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md shadow"
        style={{ borderColor: getColor(timeLeft, inDelay) }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-b-lg"
            style={{ width: `${percentage}%`, backgroundColor: getColor(timeLeft, inDelay) }}
          />
        </div>
        <div className="text-white text-2xl font-mono font-bold mb-0.5">{formatTime(timeLeft)}</div>
      </div>
    </div>
  );
};

const VideoPlayer = forwardRef(
  (
    {
      src,
      index,
      globalTimer3,
      timer2TimeLeft,
      isFullscreen = false,
      externalTimer = null,
      onTimerExpired = null,
      onVideoError = () => {},
      onReadyToPlay = () => {}
    },
    ref
  ) => {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSyncIndicator, setShowSyncIndicator] = useState(false);

    // Internal timer states - now managed externally
    const readyCallbackRef = useRef(false);

    // Check if this is the middle top video (Timer 2)
    const isMiddleTop = index === 1;

    // Helper function to get screen ID from URL
    const getScreenIdFromURL = () => {
      if (typeof window !== "undefined") {
        const pathParts = window.location.pathname.split("/");
        const screenIdPart = pathParts[pathParts.length - 1];
        return screenIdPart || `screen-${index + 1}`;
      }
      return `screen-${index + 1}`;
    };

    // WebSocket sync event listeners (with stop support)
    useEffect(() => {
      const handleSyncPlay = (event) => {
        const screenId = getScreenIdFromURL();
        const { targetScreens } = event.detail;

        if (targetScreens.includes(screenId)) {
          if (videoRef.current && videoLoaded && !videoError) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
          }
        }
      };

      const handleSyncPause = (event) => {
        const screenId = getScreenIdFromURL();
        const { targetScreens } = event.detail;

        if (targetScreens.includes(screenId)) {
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      };

      const handleSyncStop = (event) => {
        const screenId = getScreenIdFromURL();
        const { targetScreens } = event.detail;

        if (targetScreens.includes(screenId)) {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
          }
        }
      };

      const events = [
        ["play", handleSyncPlay],
        ["pause", handleSyncPause],
        ["stop", handleSyncStop]
      ];

      events.forEach(([action, listener]) => {
        window.addEventListener(`websocket-sync-${action}`, listener);
      });

      return () => {
        events.forEach(([action, listener]) => {
          window.removeEventListener(`websocket-sync-${action}`, listener);
        });
      };
    }, [index, videoLoaded, videoError]);

    // Handle timer expiration from external source
    useEffect(() => {
      if (
        externalTimer &&
        externalTimer.shouldRestart &&
        videoRef.current &&
        videoLoaded &&
        !videoError
      ) {
        videoRef.current.currentTime = 0;
        if (isPlaying) {
          videoRef.current.play().catch(console.error);
        }
        if (onTimerExpired) {
          onTimerExpired(index, false); // false = restart completed
        }
      }
    }, [externalTimer?.shouldRestart, isPlaying, videoLoaded, videoError, index]);

    // Optimized video loading handlers
    const handleVideoLoad = () => {
      if (!readyCallbackRef.current && videoRef.current) {
        console.log(`✅ Video ${index} loaded and ready`);
        readyCallbackRef.current = true;
        onReadyToPlay(index);
        setVideoError(false);
        setVideoLoaded(true);
      }
    };

    const handleVideoErrorEvent = (e) => {
      console.error(`❌ Video ${index} load error:`, e);
      setVideoError(true);
      if (!readyCallbackRef.current) {
        readyCallbackRef.current = true;
        onVideoError(index);
      }
    };

    // Global timer effect - pauses video when global timer reaches 0
    useEffect(() => {
      if (globalTimer3 === 0 && isPlaying && videoRef.current) {
        console.log(`⏰ Video ${index} paused due to global timer expiration`);
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }, [globalTimer3, isPlaying, index]);

    const toggleShowSyncIndicator = () => {
      setTimeout(() => setShowSyncIndicator(false), 500);
      setShowSyncIndicator(true);
    };

    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current && src && globalTimer3 > 0 && videoLoaded && !videoError) {
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (videoRef.current && src) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      restart: () => {
        if (videoRef.current && videoLoaded && !videoError) {
          videoRef.current.currentTime = 0;
          if (isPlaying) {
            videoRef.current.play().catch(console.error);
          }
        }
      },
      mute: () => {
        if (videoRef.current && src) {
          videoRef.current.muted = true;
          setIsMuted(true);
        }
      },
      unmute: () => {
        if (videoRef.current && src) {
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      },
      isMuted,
      isPlaying,
      hasError: videoError,
      isLoaded: videoLoaded,

      // WebSocket sync methods
      syncPlay: async () => {
        if (!videoRef.current || !videoLoaded || videoError) return;
        try {
          setIsPlaying(true);
          toggleShowSyncIndicator();
          await videoRef.current.play();
          videoRef.current.currentTime = 0;
        } catch (error) {
          console.error(`❌ Sync play failed on video ${index}:`, error);
        }
      },
      syncPause: async () => {
        if (!videoRef.current) return;
        try {
          setIsPlaying(false);
          toggleShowSyncIndicator();
          await videoRef.current.pause();
        } catch (error) {
          console.error(`❌ Sync pause failed on video ${index}:`, error);
        }
      }
    }));

    // Optimized control visibility for fullscreen
    useEffect(() => {
      let timeout;
      if (showControls && isFullscreen) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }, [showControls, isFullscreen]);

    const togglePlay = () => {
      if (videoRef.current && globalTimer3 > 0 && videoLoaded && !videoError) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
      }
    };

    const toggleMute = () => {
      if (videoRef.current && videoLoaded) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    const handleMouseMove = () => {
      if (isFullscreen) {
        setShowControls(true);
      }
    };

    const validSrc = src && (typeof src === "string" ? src.trim() : src?.url);

    return (
      <div
        className={`relative bg-gray-900 overflow-hidden border border-gray-700 transition-all shadow-lg ${
          isFullscreen ? "h-full" : "aspect-video rounded-xl"
        }`}
        onMouseMove={handleMouseMove}
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden"
        }}
      >
        {validSrc ? (
          <>
            <video
              ref={videoRef}
              src={typeof src === "string" ? src : src?.url}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              preload="metadata"
              playsInline
              onCanPlayThrough={handleVideoLoad}
              onLoadedData={handleVideoLoad}
              onLoadedMetadata={handleVideoLoad}
              onError={handleVideoErrorEvent}
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)"
              }}
            />

            {/* WebSocket Sync Command Indicator */}
            {showSyncIndicator && isFullscreen && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-blue-600/90 backdrop-blur-sm rounded-lg px-6 py-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 text-white">
                  {isPlaying ? <Play className="h-8 w-8" /> : <Pause className="h-8 w-8" />}
                  <div>
                    <div className="font-semibold">WebSocket Sync</div>
                    <div className="text-sm opacity-90">
                      {isPlaying ? "Playing All" : "Paused All"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Name Badge */}
            {src.name && (
              <div className="absolute bottom-4 right-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600/50">
                <div className="text-lg font-semibold truncate max-w-48">{src.name}</div>
              </div>
            )}

            {/* Timer Display - Only Timer 2 on middle top video */}
            {isFullscreen && src && isMiddleTop && timer2TimeLeft !== undefined && (
              <div className="absolute top-4 left-4 z-20">
                <TimerOverlay
                  timeLeft={timer2TimeLeft}
                  totalTime={src.timerDuration || 60}
                  inDelay={false}
                />
              </div>
            )}

            {/* Delay Overlay using external timer */}
            {externalTimer && externalTimer.inDelay && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex items-center justify-center p-2 md:p-4">
                <div className="text-center max-w-full w-full flex flex-col items-center justify-center h-full">
                  <div className="relative mb-2 md:mb-4 flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 sm:border-4 md:border-6 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                      <RotateCw className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white animate-spin" />
                    </div>
                    <div className="w-32 sm:w-40 md:w-48 lg:w-56 h-1 md:h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
                        style={{
                          width: `${
                            externalTimer.delayTimeLeft
                              ? ((externalTimer.delayDuration - externalTimer.delayTimeLeft) /
                                  externalTimer.delayDuration) *
                                100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2 text-center px-2">
                    {externalTimer.delayText || "Restarting..."}
                  </div>
                </div>
              </div>
            )}

            {/* Video Error Overlay */}
            {videoError && (
              <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm z-30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white text-6xl font-bold mb-4">⚠️ VIDEO ERROR</div>
                  <div className="text-red-200 text-3xl">Failed to load video</div>
                </div>
              </div>
            )}

            {/* Global Timer Expired Overlay */}
            {globalTimer3 === 0 && (
              <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm z-30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white text-6xl font-bold mb-4">⏰ TIME'S UP!</div>
                  <div className="text-red-200 text-3xl">The class is over.</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center p-12">
              <div className="mb-6 p-8 bg-gray-700/50 rounded-full w-fit mx-auto">
                <div className={`${isFullscreen ? "text-8xl" : "text-4xl"}`}>📺</div>
              </div>
              <p
                className={`${isFullscreen ? "text-4xl" : "text-lg"} font-bold text-gray-300 mb-4`}
              >
                Player {index + 1}
              </p>
              <p className={`${isFullscreen ? "text-2xl" : "text-sm"} text-gray-500`}>
                No video assigned
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
