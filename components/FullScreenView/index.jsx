import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback } from "react";

import useTimerManagement from "./useTimerManagement";

import VideoGrid from "./VideoGrid";
import LoadingOverlay from "./LoadingOverlay";
import FullscreenHeader from "./FullScreenHeader";
import RectangularTimer from "./RectangularTimer";
import FullscreenControls from "./FullScreenControls";
import ClassCountdownModal from "./ClassCountdownModal";

const CURSOR_HIDE_DELAY = 3000;

const FullScreenView = ({ assignments, onClose, globalTimer3, globalTimers, screenId }) => {
  const [isAllMuted, setIsAllMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isAllPlaying, setIsAllPlaying] = useState(false);
  const [isCountdownOpen, setIsCountdownOpen] = useState(false);
  const [videosReady, setVideosReady] = useState(Array(assignments.length).fill(false));
  const [videoErrors, setVideoErrors] = useState(Array(assignments.length).fill(false));

  const videoRefs = useRef([]);
  const cursorTimeoutRef = useRef();
  const searchParams = useSearchParams();
  const originalScreenId = searchParams.get("from");

  const { timerStates, timerValues, startAllTimers, stopAllTimers, setTimerStates } =
    useTimerManagement(assignments, globalTimer3, globalTimers, isAllPlaying, videoRefs);

  const allVideosReady = assignments.every(
    (video, i) => !video || videosReady[i] || videoErrors[i]
  );

  const handleVideoReady = useCallback((index) => {
    setVideosReady((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  }, []);

  const handleVideoError = useCallback((index) => {
    setVideoErrors((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  }, []);

  const handlePlayPauseAll = useCallback(() => {
    const newPlayingState = !isAllPlaying;

    if (newPlayingState && !isCountdownOpen) {
      setIsCountdownOpen(true);
    } else if (!newPlayingState) {
      videoRefs.current.forEach((ref, index) => {
        if (ref && assignments[index]) {
          ref.pause?.();
        }
      });

      setIsAllPlaying(false);
      stopAllTimers();
    }
  }, [isAllPlaying, isCountdownOpen, assignments, stopAllTimers]);

  const handleCountdownComplete = useCallback(() => {
    videoRefs.current.forEach((ref, index) => {
      if (ref && assignments[index]) {
        ref.play?.();
      }
    });

    startAllTimers();
    setIsAllPlaying(true);
    setIsCountdownOpen(false);
  }, [assignments, startAllTimers]);

  const handleCountdownCancel = useCallback(() => {
    setIsCountdownOpen(false);
  }, []);

  const handleResetAll = useCallback(() => {
    videoRefs.current.forEach((ref) => ref?.restart?.());
    videoRefs.current.forEach((ref) => ref?.pause?.());
    setIsAllPlaying(false);
    stopAllTimers();

    setTimerStates({
      global: { timeLeft: globalTimer3 || 2700, active: false },
      timer1: {
        active: false,
        inDelay: false,
        shouldRestart: false,
        timeLeft: timerValues.timer1.duration || 60,
        delayTimeLeft: timerValues.timer1.delay || 30
      },
      timer2: {
        active: false,
        shouldRestart: false,
        timeLeft: timerValues.timer2.duration || 60
      }
    });
  }, [stopAllTimers, setIsAllPlaying, setTimerStates, globalTimer3, timerValues]);

  const handleMuteUnmuteAll = useCallback(() => {
    videoRefs.current.forEach((ref) => {
      if (ref) {
        if (isAllMuted) {
          ref.unmute?.();
        } else {
          ref.mute?.();
        }
      }
    });
    setIsAllMuted(!isAllMuted);
  }, [isAllMuted]);

  const handleWorkoutScreenToggle = useCallback(() => {
    const onWarmupScreen = screenId === "4";
    const targetScreenId = onWarmupScreen ? originalScreenId : "4";
    const lastScreenId = onWarmupScreen ? "" : `&from=${screenId}`;

    window.location.href = `/dashboard/${targetScreenId}?fullscreen=true${lastScreenId}`;
  }, [screenId, originalScreenId]);

  useEffect(() => {
    const handleSyncPlay = (event) => {
      const { targetScreens } = event.detail;
      if (targetScreens.includes(screenId)) {
        console.log("🎬 FullScreenView responding to sync play");

        videoRefs.current.forEach((ref, index) => {
          if (ref && assignments[index] && ref.syncPlay) {
            ref.syncPlay();
          }
        });

        setIsAllPlaying(true);
        startAllTimers();
      }
    };

    const handleSyncPause = (event) => {
      const { targetScreens } = event.detail;
      if (targetScreens.includes(screenId)) {
        console.log("⏸️ FullScreenView responding to sync pause");

        videoRefs.current.forEach((ref, index) => {
          if (ref && assignments[index] && ref.syncPause) {
            ref.syncPause();
          }
        });

        setIsAllPlaying(false);
        stopAllTimers();
      }
    };

    const handleSyncStop = (event) => {
      const { targetScreens } = event.detail;
      if (targetScreens.includes(screenId)) {
        console.log("⏹️ FullScreenView responding to sync stop");

        videoRefs.current.forEach((ref, index) => {
          if (ref && assignments[index] && ref.syncPause) {
            ref.syncPause();
          }
        });

        setTimerStates({
          global: { timeLeft: globalTimer3 || 2700, active: true },
          timer1: {
            active: true,
            inDelay: false,
            shouldRestart: false,
            timeLeft: timerValues.timer1.duration || 60,
            delayTimeLeft: timerValues.timer1.delay || 30
          },
          timer2: {
            active: true,
            shouldRestart: false,
            timeLeft: timerValues.timer2.duration || 60
          }
        });

        setIsAllPlaying(false);
        stopAllTimers();
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
  }, [screenId, assignments, globalTimer3, timerValues, setTimerStates, stopAllTimers]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleMouseMove = () => {
      setShowControls(true);
      document.body.style.cursor = "default";

      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }

      cursorTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        document.body.style.cursor = "none";
      }, CURSOR_HIDE_DELAY);
    };

    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("mousemove", handleMouseMove);

    cursorTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      document.body.style.cursor = "none";
    }, CURSOR_HIDE_DELAY);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "default";
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, [onClose]);

  useEffect(() => {
    setTimerStates((prev) => ({
      ...prev,
      global: { ...prev.global, timeLeft: globalTimer3 || 2700 }
    }));
  }, [globalTimer3, setTimerStates]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
      {!allVideosReady && (
        <LoadingOverlay
          assignments={assignments}
          videosReady={videosReady}
          videoErrors={videoErrors}
        />
      )}

      <FullscreenHeader
        onClose={onClose}
        onReset={handleResetAll}
        timerStates={timerStates}
        timerValues={timerValues}
        globalTimer3={globalTimer3}
        onWorkoutScreenToggle={handleWorkoutScreenToggle}
      />

      <VideoGrid
        assignments={assignments}
        videoRefs={videoRefs}
        timerStates={timerStates}
        timerValues={timerValues}
        onVideoReady={handleVideoReady}
        onVideoError={handleVideoError}
      />

      <FullscreenControls
        showControls={showControls}
        isAllPlaying={isAllPlaying}
        isAllMuted={isAllMuted}
        onPlayPause={handlePlayPauseAll}
        onMuteUnmute={handleMuteUnmuteAll}
      />

      <ClassCountdownModal
        isOpen={isCountdownOpen}
        onClose={handleCountdownCancel}
        onComplete={handleCountdownComplete}
        countdownSeconds={globalTimers?.timer4 || 120}
      />
    </div>
  );
};

export default FullScreenView;
export { RectangularTimer };
