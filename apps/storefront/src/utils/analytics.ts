export function pushAnalyticsEvent(event: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as Window & { dataLayer?: Record<string, unknown>[] };
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.dataLayer.push({ event, ...parameters });
}
