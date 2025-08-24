import VideoPlayer from "../VideoPlayer";

const VideoGrid = ({
  assignments,
  videoRefs,
  timerStates,
  timerValues,
  onVideoReady,
  onVideoError
}) => {
  const gridCols = Math.ceil(Math.sqrt(assignments.length));
  const gridRows = Math.ceil(assignments.length / gridCols);

  const getExternalTimer = (index) => {
    return index !== 1
      ? {
          inDelay: timerStates.timer1.inDelay,
          timeLeft: timerStates.timer1.timeLeft,
          delayDuration: timerValues.timer1.delay,
          delayText: timerValues.timer1.delayText,
          delayTimeLeft: timerStates.timer1.delayTimeLeft,
          shouldRestart: timerStates.timer1.shouldRestart
        }
      : null;
  };

  return (
    <div
      className="flex-1 p-3 grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        height: "calc(100% - 8rem)",
        minHeight: 0
      }}
    >
      {assignments.map((assignment, index) => (
        <div key={index} className="w-full h-full overflow-hidden">
          <VideoPlayer
            ref={(el) => (videoRefs.current[index] = el)}
            src={assignment}
            index={index}
            isFullscreen={true}
            globalTimer3={timerStates.global.timeLeft}
            timer2TimeLeft={timerStates.timer2.timeLeft}
            timer2Active={timerStates.timer2.active}
            externalTimer={getExternalTimer(index)}
            onReadyToPlay={() => onVideoReady(index)}
            onVideoError={() => onVideoError(index)}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
