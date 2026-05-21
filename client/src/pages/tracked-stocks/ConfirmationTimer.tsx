// Countdown clock component visualizing provisional window expiry limits
import React, { useEffect } from 'react'
import { useConfirmationTimer } from '../../hooks/useConfirmationTimer'

interface ConfirmationTimerProps {
  initialSeconds?: number
  onExpiry?: () => void
}

export function ConfirmationTimer({ initialSeconds = 300, onExpiry }: ConfirmationTimerProps) {
  const { formattedTime, secondsLeft, startTimer } = useConfirmationTimer(initialSeconds);

  useEffect(() => {
    startTimer();
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && onExpiry) {
      onExpiry();
    }
  }, [secondsLeft, onExpiry]);

  return (
    <span className={`font-mono text-xs px-2 py-1 rounded bg-muted font-bold ${secondsLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-foreground'}`}>
      {formattedTime}
    </span>
  );
}
export default ConfirmationTimer
