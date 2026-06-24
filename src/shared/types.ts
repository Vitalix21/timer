export interface TimerState {
  totalTime: number;
  currentTime: number;
  isRunning: boolean;
  endTime: number | null;
}

export function isTimerState(obj: unknown): obj is TimerState {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  return (
    "totalTime" in obj &&
    typeof obj.totalTime === "number" &&
    "currentTime" in obj &&
    typeof obj.currentTime === "number" &&
    "isRunning" in obj &&
    typeof obj.isRunning === "boolean" &&
    "endTime" in obj &&
    (typeof obj.endTime === "number" || obj.endTime === null)
  );
}
