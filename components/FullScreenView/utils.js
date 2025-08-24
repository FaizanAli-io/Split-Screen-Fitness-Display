export const createTimerState = (timer3, timer1, timer2, delay1) => ({
  global: { timeLeft: timer3 || 2700, active: false },
  timer1: {
    active: false,
    inDelay: false,
    shouldRestart: false,
    timeLeft: timer1 || 60,
    delayTimeLeft: delay1 || 30
  },
  timer2: {
    active: false,
    shouldRestart: false,
    timeLeft: timer2 || 60
  }
});

export const performVideoAction = (videoRefs, assignments, action) => {
  videoRefs.current.forEach((ref, index) => {
    if (ref && assignments[index] && ref[action]) {
      ref[action]();
    }
  });
};

export const createArrayUpdater = (setState) => (index, value) => {
  setState((prev) => {
    const updated = [...prev];
    updated[index] = value;
    return updated;
  });
};

export const formatTime = (seconds) => {
  const secs = seconds % 60;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const playBeepSound = () => {
  const playIndividualChime = (delay = 0) => {
    setTimeout(() => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Pleasant, warm frequencies (like a gentle bell)
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(1200, audioContext.currentTime);

        oscillator1.type = "sine";
        oscillator2.type = "sine";

        // Gentle volume with smooth fade in and out
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);

        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.8);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.8);

        // Clean up this audio context
        setTimeout(() => {
          try {
            audioContext.close();
          } catch (e) {
            console.warn("Audio context cleanup failed:", e);
          }
        }, 1000);
      } catch (error) {
        console.warn("Could not play individual chime:", error);
        // Fallback for this individual chime
        try {
          const audio = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAzGHz+rJeCMF"
          );
          audio.volume = 0.5;
          audio.play().catch(() => {
            console.warn("Fallback chime failed");
          });
        } catch (e) {
          console.warn("Fallback chime failed:", e);
        }
      }
    }, delay);
  };

  // Play 4 gentle chimes with 1200ms intervals for a pleasant notification
  for (let i = 0; i < 4; i++) playIndividualChime(i * 1200);
};
