import type { FeedbackClientInfo } from '../api/types';

/** Grobe Gerätetyp-Einordnung aus dem User-Agent (nur Anhaltspunkt, kein exaktes Fingerprinting). */
function detectDeviceType(ua: string): string {
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return 'Tablet';
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return 'Mobil';
  return 'Desktop';
}

/**
 * Sammelt Client-/Gerätedetails als Feedback-Kontext, soweit der Browser sie preisgibt.
 * Defensiv: einzelne fehlende APIs dürfen das Feedback nicht verhindern.
 */
export function collectClientInfo(): FeedbackClientInfo {
  const info: FeedbackClientInfo = {};
  try {
    const ua = navigator.userAgent ?? '';
    info.userAgent = ua;
    info.deviceType = detectDeviceType(ua);
    info.language = navigator.language;
    info.platform = navigator.platform;
    info.viewport = `${window.innerWidth}x${window.innerHeight}`;
    if (window.screen) info.screen = `${window.screen.width}x${window.screen.height}`;
    info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Einzelne Felder bleiben leer — egal, der Kontext ist optional.
  }
  return info;
}
