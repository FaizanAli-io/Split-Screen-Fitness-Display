import Image from "next/image";
import { Button } from "../ui/button";
import { X, Dumbbell, Repeat } from "lucide-react";
import RectangularTimer from "./RectangularTimer";

const FullscreenHeader = ({
  timerStates,
  timerValues,
  globalTimer3,
  onClose,
  onReset,
  onWorkoutScreenToggle
}) => {
  const getButtonStyle = (color) =>
    `h-8 w-8 p-0 bg-${color}-600/30 hover:bg-${color}-600/50 border border-${color}-500/50 hover:border-${color}-400/80 transition-all duration-300 rounded-lg shadow-lg hover:shadow-${color}-500/25 backdrop-blur-sm`;

  const getIconStyle = (color) =>
    `h-5 w-5 text-${color}-300 hover:text-${color}-100 transition-colors duration-200`;

  return (
    <div className="relative h-36 bg-black border-b-2 border-gray-600 shadow-2xl">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative flex items-center justify-between h-full px-6 pr-16">
        <div className="flex items-center justify-between w-full gap-6">
          <div className="transform hover:scale-105 transition-transform duration-200">
            <RectangularTimer
              timeLeft={
                timerStates.timer1.inDelay
                  ? timerStates.timer1.delayTimeLeft
                  : timerStates.timer1.timeLeft
              }
              totalTime={
                timerStates.timer1.inDelay ? timerValues.timer1.delay : timerValues.timer1.duration
              }
              label="Station Time"
              inDelay={timerStates.timer1.inDelay}
            />
          </div>

          <div className="flex items-center justify-center">
            <Image
              alt="Logo"
              width={100}
              height={100}
              src="/logo.svg"
              className="object-contain drop-shadow-2xl"
            />
          </div>

          <div className="transform hover:scale-105 transition-transform duration-200">
            <RectangularTimer
              timeLeft={timerStates.global.timeLeft}
              totalTime={globalTimer3 || 2700}
              label="Class Time"
              invert={true}
            />
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-2 mt-2 z-10">
        <Button variant="secondary" size="sm" onClick={onClose} className={getButtonStyle("red")}>
          <X className={getIconStyle("red")} />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          className={getButtonStyle("purple")}
        >
          <Repeat className={getIconStyle("purple")} />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onWorkoutScreenToggle}
          className={getButtonStyle("blue")}
        >
          <Dumbbell className={getIconStyle("blue")} />
        </Button>
      </div>
    </div>
  );
};

export default FullscreenHeader;
