import { useState, useEffect, useRef } from 'react';
import { getTimeRemaining, formatTimeRemaining, getTimerColor, getTimerIcon } from '@/utils/questTimer';

/**
 * Hook for quest countdown timer with automatic updates
 */
export function useQuestTimer(expiresAt: string | number | null | undefined) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    expiresAt ? getTimeRemaining(expiresAt) : null
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    // Update immediately
    const updateTime = () => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Stop updating if expired
      if (remaining.isExpired && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    updateTime();

    // Update every second
    intervalRef.current = setInterval(updateTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [expiresAt]);

  return timeRemaining;
}

/**
 * Hook for formatted quest timer display
 */
export function useFormattedQuestTimer(
  expiresAt: string | number | null | undefined,
  short: boolean = false
) {
  const timeRemaining = useQuestTimer(expiresAt);

  if (!timeRemaining || !expiresAt) {
    return {
      formatted: null,
      color: '#888',
      icon: '🕐',
      isExpired: false,
      isExpiringSoon: false,
      isExpiringVerySoon: false
    };
  }

  return {
    formatted: formatTimeRemaining(expiresAt, short),
    color: getTimerColor(expiresAt),
    icon: getTimerIcon(expiresAt),
    isExpired: timeRemaining.isExpired,
    isExpiringSoon: timeRemaining.isExpiringSoon,
    isExpiringVerySoon: timeRemaining.isExpiringVerySoon,
    timeRemaining
  };
}
