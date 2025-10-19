/**
 * Web-compatible haptics service
 * Uses Vibration API if available, or no-ops
 */

export const ImpactFeedbackStyle = {
  Light: 'light' as const,
  Medium: 'medium' as const,
  Heavy: 'heavy' as const,
  Rigid: 'rigid' as const,
  Soft: 'soft' as const,
};

export const NotificationFeedbackType = {
  Success: 'success' as const,
  Warning: 'warning' as const,
  Error: 'error' as const,
};

export async function impactAsync(style?: typeof ImpactFeedbackStyle[keyof typeof ImpactFeedbackStyle]) {
  if ('vibrate' in navigator) {
    // Different vibration patterns for different impact styles
    const patterns: Record<string, number> = {
      light: 10,
      medium: 20,
      heavy: 30,
      rigid: 15,
      soft: 25,
    };
    const duration = patterns[style || 'medium'] || 20;
    navigator.vibrate(duration);
  }
}

export async function notificationAsync(type?: typeof NotificationFeedbackType[keyof typeof NotificationFeedbackType]) {
  if ('vibrate' in navigator) {
    // Different patterns for different notification types
    const patterns: Record<string, number[]> = {
      success: [10, 50, 10],
      warning: [30, 100, 30],
      error: [50, 100, 50],
    };
    const pattern = patterns[type || 'success'] || [10, 50, 10];
    navigator.vibrate(pattern);
  }
}

export async function selectionAsync() {
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
}

