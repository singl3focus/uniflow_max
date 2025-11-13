/**
 * MAX Bridge integration
 * Provides a typed wrapper around window.WebApp for safe interaction
 * with MAX client features (user data, haptic feedback, back button, etc.)
 */

export interface WebAppData {
  query_id: string;
  auth_date: number;
  hash: string;
  start_param?: Record<string, string>;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
  };
  chat?: {
    id: number;
    type: string;
  };
}

export interface BackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

export interface HapticFeedback {
  impactOccurred: (style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid', disableVibrationFallback?: boolean) => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning', disableVibrationFallback?: boolean) => void;
  selectionChanged: (disableVibrationFallback?: boolean) => void;
}

export interface ScreenCapture {
  isScreenCaptureEnabled: boolean;
  enableScreenCapture: () => void;
  disableScreenCapture: () => void;
}

export interface WebApp {
  initData: string;
  initDataUnsafe: WebAppData;
  platform: 'ios' | 'android' | 'desktop' | 'web';
  version: string;
  ready: () => void;
  close: () => void;
  requestContact: () => void;
  onEvent: (eventName: string, callback: (data?: unknown) => void) => void;
  offEvent: (eventName: string, callback: (data?: unknown) => void) => void;
  BackButton: BackButton;
  HapticFeedback: HapticFeedback;
  ScreenCapture: ScreenCapture;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  openLink: (url: string) => void;
  openMaxLink: (url: string) => void;
  shareContent: (text: string, link: string) => void;
  shareMaxContent: (text: string, link: string) => void;
  downloadFile: (url: string, fileName: string) => void;
  openCodeReader: (fileSelect?: boolean) => void;
}

/**
 * Safe accessor for window.WebApp
 * Returns null if running in non-MAX environment (e.g., dev/test)
 */
export function getMaxBridge(): WebApp | null {
  if (typeof window === 'undefined') return null;
  return (window as any).WebApp || null;
}

/**
 * Initialize MAX Bridge on app startup
 * - Signal readiness to MAX client
 * - Set up back button and other listeners if needed
 */
export function initMaxBridge(): void {
  const webApp = getMaxBridge();
  if (!webApp) {
    console.warn('[MAX Bridge] WebApp not available in this environment');
    return;
  }

  // Signal that the mini-app is ready
  try {
    webApp.ready();
    console.log('[MAX Bridge] WebApp ready signal sent');
  } catch (e) {
    console.warn('[MAX Bridge] Error calling ready():', e);
  }

  // Disable screen capture if needed (can be toggled per-page if sensitive)
  // webApp.ScreenCapture.disableScreenCapture();
}

/**
 * Get user data from MAX Bridge
 * Uses initDataUnsafe (only safe if you validate hash on backend)
 */
export function getMaxUserData(): WebAppData['user'] | null {
  const webApp = getMaxBridge();
  if (!webApp) return null;
  return webApp.initDataUnsafe?.user || null;
}

/**
 * Get full init data (for backend validation of hash)
 */
export function getMaxInitData(): WebAppData | null {
  const webApp = getMaxBridge();
  if (!webApp) return null;
  return webApp.initDataUnsafe || null;
}

/**
 * Trigger haptic feedback on user interaction
 */
export function triggerHaptic(type: 'impact' | 'success' | 'error' | 'warning' | 'selection' = 'selection'): void {
  const webApp = getMaxBridge();
  if (!webApp?.HapticFeedback) return;

  try {
    switch (type) {
      case 'impact':
        webApp.HapticFeedback.impactOccurred('light');
        break;
      case 'success':
        webApp.HapticFeedback.notificationOccurred('success');
        break;
      case 'error':
        webApp.HapticFeedback.notificationOccurred('error');
        break;
      case 'warning':
        webApp.HapticFeedback.notificationOccurred('warning');
        break;
      case 'selection':
        webApp.HapticFeedback.selectionChanged();
        break;
    }
  } catch (e) {
    console.warn('[MAX Bridge] Error triggering haptic:', e);
  }
}

/**
 * Show/hide back button
 */
export function setBackButtonVisible(visible: boolean): void {
  const webApp = getMaxBridge();
  if (!webApp?.BackButton) return;

  try {
    if (visible) {
      webApp.BackButton.show();
    } else {
      webApp.BackButton.hide();
    }
  } catch (e) {
    console.warn('[MAX Bridge] Error setting back button:', e);
  }
}

/**
 * Register back button click handler
 */
export function onBackButtonClick(callback: () => void): () => void {
  const webApp = getMaxBridge();
  if (!webApp?.BackButton) return () => {};

  try {
    webApp.BackButton.onClick(callback);
    // Return unsubscribe function
    return () => {
      try {
        webApp.BackButton.offClick(callback);
      } catch (e) {
        console.warn('[MAX Bridge] Error unsubscribing back button:', e);
      }
    };
  } catch (e) {
    console.warn('[MAX Bridge] Error subscribing to back button:', e);
    return () => {};
  }
}

/**
 * Share content via native MAX share
 */
export function shareToMax(text: string, link: string): void {
  const webApp = getMaxBridge();
  if (!webApp) return;

  try {
    webApp.shareMaxContent(text, link);
  } catch (e) {
    console.warn('[MAX Bridge] Error sharing to MAX:', e);
  }
}

/**
 * Open a link in external browser
 */
export function openExternalLink(url: string): void {
  const webApp = getMaxBridge();
  if (!webApp) return;

  try {
    webApp.openLink(url);
  } catch (e) {
    console.warn('[MAX Bridge] Error opening link:', e);
  }
}
