// Custom hook managing active countdown state for provisional order confirmations
import { useState, useEffect, useRef } from 'react'

export function useConfirmationTimer(initialSeconds = 300) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = (newSeconds = initialSeconds) => {
    setSecondsLeft(newSeconds);
    setIsActive(false);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return {
    secondsLeft,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
    formattedTime,
  };
}
export default useConfirmationTimer
