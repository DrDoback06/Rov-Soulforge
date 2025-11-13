/**
 * Haptic Feedback Utilities
 *
 * Provides tactile feedback for various game actions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Check if haptics are supported on this device
 */
export function isHapticsSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Light impact - for button taps, selections
 */
export async function lightImpact() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Medium impact - for card plays, item pickups
 */
export async function mediumImpact() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Heavy impact - for level ups, quest completions
 */
export async function heavyImpact() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Success notification - for objectives completed, achievements unlocked
 */
export async function successNotification() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Warning notification - for low health, time running out
 */
export async function warningNotification() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Error notification - for failed actions, invalid moves
 */
export async function errorNotification() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Selection changed - for scrolling through items, changing tabs
 */
export async function selectionChanged() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Quest objective completed - special haptic pattern
 */
export async function questObjectiveCompleted() {
  if (!isHapticsSupported()) return;
  try {
    // Double tap pattern: light -> wait -> medium
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Quest fully completed - celebration haptic pattern
 */
export async function questCompleted() {
  if (!isHapticsSupported()) return;
  try {
    // Triple tap escalating pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Level up - celebration haptic pattern
 */
export async function levelUp() {
  if (!isHapticsSupported()) return;
  try {
    // Rapid succession of increasing impacts
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Battle hit - impact feedback for combat
 */
export async function battleHit(damage: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!isHapticsSupported()) return;
  try {
    const style =
      damage === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : damage === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium;

    await Haptics.impactAsync(style);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Card collected - reward haptic
 */
export async function cardCollected() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}
