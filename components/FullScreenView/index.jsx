import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback } from "react";

import useTimerManagement from "./useTimerManagement";
import { createTimerState, performVideoAction } from "./utils";

import VideoGrid from "./VideoGrid";
import LoadingOverlay from "./LoadingOverlay";
import FullscreenHeader from "./FullScreenHeader";
import FullscreenControls from "./FullScreenControls";
import ClassCountdownModal from "./ClassCountdownModal";

const CURSOR_HIDE_DELAY = 2000;

const FullScreenView = ({ screenId, onClose, assignments, globalTimers }) => {
  const [isAllMuted, setIsAllMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isAllPlaying, setIsAllPlaying] = useState(false);
  const [isCountdownOpen, setIsCountdownOpen] = useState(false);
  const [videosReady, setVideosReady] = useState(Array(assignments.length).fill(false));
  const [videoErrors, setVideoErrors] = useState(Array(assignments.length).fill(false));
  const [forceShow, setForceShow] = useState(false);

  const videoRefs = useRef([]);
  const cursorTimeoutRef = useRef();
  const searchParams = useSearchParams();
  const originalScreenId = searchParams.get("from");
  const globalTimer3 = globalTimers.timer3;

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("Force showing content after 10 seconds");
      setForceShow(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const { timerStates, timerValues, startAllTimers, stopAllTimers, setTimerStates } =
    useTimerManagement(assignments, globalTimers, isAllPlaying, videoRefs, {
      onTimer2ExpireWithPause: () => {
        performVideoAction(videoRefs, assignments, "pause");
        stopAllTimers();
        setIsAllPlaying(false);
        setIsCountdownOpen(true);
      }
    });

  const allVideosReady =
    assignments.every((video, i) => !video || videosReady[i] || videoErrors[i]) || forceShow;

  const handleVideoReady = useCallback((index) => {
    console.log(`Video ${index} ready`);
    setVideosReady((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  }, []);

  const handleVideoError = useCallback((index) => {
    console.log(`Video ${index} error`);
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
      performVideoAction(videoRefs, assignments, "pause");
    }

    setIsAllPlaying(false);
    stopAllTimers();
  }, [isAllPlaying, isCountdownOpen, assignments, stopAllTimers]);

  const handleCountdownComplete = useCallback(() => {
    startAllTimers();
    setIsAllPlaying(true);
    setIsCountdownOpen(false);
    performVideoAction(videoRefs, assignments, "play");
  }, [assignments, startAllTimers]);

  const handleCountdownCancel = useCallback(() => {
    setIsCountdownOpen(false);
  }, []);

  const handleResetAll = useCallback(() => {
    performVideoAction(videoRefs, assignments, "restart");
    performVideoAction(videoRefs, assignments, "pause");
    setIsAllPlaying(false);
    stopAllTimers();
    setTimerStates(
      createTimerState(
        globalTimer3,
        timerValues.timer1.duration,
        timerValues.timer2.duration,
        timerValues.timer1.delay
      )
    );
  }, [stopAllTimers, globalTimer3, timerValues, setTimerStates]);

  const handleMuteUnmuteAll = useCallback(() => {
    const action = isAllMuted ? "unmute" : "mute";
    performVideoAction(videoRefs, assignments, action);
    setIsAllMuted(!isAllMuted);
  }, [isAllMuted, assignments]);

  const handleWorkoutScreenToggle = useCallback(() => {
    const onWarmupScreen = screenId === "4";
    const targetScreenId = onWarmupScreen ? originalScreenId : "4";
    const lastScreenId = onWarmupScreen ? "" : `&from=${screenId}`;

    window.location.href = `/dashboard/${targetScreenId}?fullscreen=true${lastScreenId}`;
  }, [screenId, originalScreenId]);

  useEffect(() => {
    const createSyncHandler = (action) => (event) => {
      const { targetScreens } = event.detail;
      if (!targetScreens.includes(screenId)) return;

      console.log(`FullScreenView responding to sync ${action}`);

      if (action === "stop") {
        setTimerStates(
          createTimerState(
            globalTimer3,
            timerValues.timer1.duration,
            timerValues.timer2.duration,
            timerValues.timer1.delay
          )
        );
      }

      performVideoAction(videoRefs, assignments, "syncPause");

      if (action === "play") {
        if (!isAllPlaying && !isCountdownOpen) {
          setIsCountdownOpen(true);
        }
      } else {
        setIsAllPlaying(false);
        stopAllTimers();
      }
    };

    const handlers = {
      "websocket-sync-play": createSyncHandler("play"),
      "websocket-sync-pause": createSyncHandler("pause"),
      "websocket-sync-stop": createSyncHandler("stop")
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [
    screenId,
    assignments,
    globalTimer3,
    timerValues,
    setTimerStates,
    stopAllTimers,
    startAllTimers
  ]);

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
