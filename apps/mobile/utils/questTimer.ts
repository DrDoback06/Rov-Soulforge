/**
 * Quest Timer Utilities
 *
 * Handles quest expiration calculations and formatting
 */

/**
 * Calculate time remaining until quest expires
 */
export function getTimeRemaining(expiresAt: string | number): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // Less than 1 hour
  isExpiringVerySoon: boolean; // Less than 15 minutes
} {
  const expirationTime = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt;
  const now = Date.now();
  const total = expirationTime - now;

  if (total <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isExpiringSoon: false,
      isExpiringVerySoon: false
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  const totalMinutes = Math.floor(total / (1000 * 60));
  const isExpiringSoon = totalMinutes < 60; // Less than 1 hour
  const isExpiringVerySoon = totalMinutes < 15; // Less than 15 minutes

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    isExpiringSoon,
    isExpiringVerySoon
  };
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(expiresAt: string | number, short: boolean = false): string {
  const time = getTimeRemaining(expiresAt);

  if (time.isExpired) {
    return 'Expired';
  }

  if (short) {
    // Short format for compact display
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h`;
    }
    if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m`;
    }
    if (time.minutes > 0) {
      return `${time.minutes}m`;
    }
    return `${time.seconds}s`;
  }

  // Long format for detailed display
  const parts: string[] = [];

  if (time.days > 0) {
    parts.push(`${time.days} ${time.days === 1 ? 'day' : 'days'}`);
  }
  if (time.hours > 0) {
    parts.push(`${time.hours} ${time.hours === 1 ? 'hour' : 'hours'}`);
  }
  if (time.minutes > 0 && time.days === 0) {
    parts.push(`${time.minutes} ${time.minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (time.seconds > 0 && time.days === 0 && time.hours === 0) {
    parts.push(`${time.seconds} ${time.seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(', ');
}

/**
 * Get color for timer based on urgency
 */
export function getTimerColor(expiresAt: string | number): string {
  const time = getTimeRemaining(expiresAt);

  if (time.isExpired) {
    return '#888'; // Gray
  }
  if (time.isExpiringVerySoon) {
    return '#f44336'; // Red
  }
  if (time.isExpiringSoon) {
    return '#ff9800'; // Orange
  }
  return '#4caf50'; // Green
}

/**
 * Get icon for timer based on urgency
 */
export function getTimerIcon(expiresAt: string | number): string {
  const time = getTimeRemaining(expiresAt);

  if (time.isExpired) {
    return '⏰'; // Alarm (expired)
  }
  if (time.isExpiringVerySoon) {
    return '⏱️'; // Stopwatch (urgent)
  }
  if (time.isExpiringSoon) {
    return '⌛'; // Hourglass (soon)
  }
  return '🕐'; // Clock (plenty of time)
}

/**
 * Calculate when quest will expire based on duration
 */
export function calculateExpirationTime(
  startTime: string | number,
  durationHours: number
): number {
  const start = typeof startTime === 'string' ? new Date(startTime).getTime() : startTime;
  return start + (durationHours * 60 * 60 * 1000);
}

/**
 * Check if quest should show expiration warning
 */
export function shouldShowExpirationWarning(expiresAt: string | number): boolean {
  const time = getTimeRemaining(expiresAt);
  return time.isExpiringSoon && !time.isExpired;
}

/**
 * Get progress percentage of quest duration elapsed
 */
export function getQuestDurationProgress(
  startTime: string | number,
  expiresAt: string | number
): number {
  const start = typeof startTime === 'string' ? new Date(startTime).getTime() : startTime;
  const end = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt;
  const now = Date.now();

  const totalDuration = end - start;
  const elapsed = now - start;

  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;

  return Math.round((elapsed / totalDuration) * 100);
}
