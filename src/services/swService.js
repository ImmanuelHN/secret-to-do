/**
 * Service Worker registration + background notification manager
 * Handles: SW registration, notification actions (snooze/done/reschedule)
 */

let swRegistration = null;

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[SW] Registered:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
    return null;
  }
}

export function getSWRegistration() { return swRegistration; }

/**
 * Show a notification via Service Worker (works in background)
 * Falls back to basic Notification API if SW not available.
 */
export async function showNotification(title, options = {}) {
  const reg = swRegistration || (await navigator.serviceWorker?.ready);
  if (reg?.showNotification) {
    await reg.showNotification(title, {
      icon:    '/favicon.svg',
      badge:   '/favicon.svg',
      silent:  false,
      vibrate: [200, 100, 200],
      ...options,
    });
  } else if (Notification.permission === 'granted') {
    new Notification(title, { icon: '/favicon.svg', ...options });
  }
}

/**
 * Show water/meal/habit reminder with action buttons:
 * [Snooze] [Done] [+]
 */
export async function showActionNotification({ title, body, tag, data = {}, snoozeMin = 10 }) {
  const actions = [
    { action: 'snooze',     title: `⏸ Snooze ${snoozeMin}m` },
    { action: 'done',       title: '✅ Done' },
    { action: 'reschedule', title: '+ Reschedule' },
  ];

  await showNotification(title, {
    body,
    tag,
    data: { ...data, snoozeMin },
    actions,
    requireInteraction: true,
    renotify: true,
  });
}

/**
 * Listen for messages from the Service Worker (notif action responses)
 */
export function onSWMessage(handler) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', e => handler(e.data));
}
