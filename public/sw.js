/* ─────────────────────────────────────────────────────────────
   Secret To-Do — Service Worker
   Handles background notifications, notification actions (snooze/done/+)
───────────────────────────────────────────────────────────── */
const CACHE_NAME = 'secret-todo-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

/* ── Notification click handler ─────────────────────────────── */
self.addEventListener('notificationclick', e => {
  const { action, notification } = e;
  const data = notification.data || {};
  notification.close();

  if (action === 'done') {
    // Post message to app: mark task/habit as done
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(cs => {
        cs.forEach(c => c.postMessage({ type: 'NOTIF_DONE', tag: notification.tag, data }));
      })
    );
    return;
  }

  if (action === 'snooze') {
    const snoozeMin = data.snoozeMin || 10;
    const delay = snoozeMin * 60 * 1000;
    e.waitUntil(
      new Promise(resolve => {
        setTimeout(() => {
          self.registration.showNotification(notification.title, {
            body: `⏰ Snoozed: ${notification.body}`,
            icon: '/favicon.svg',
            tag: notification.tag + '-snoozed',
            data,
            actions: notification.actions,
          });
          resolve();
        }, delay);
      })
    );
    return;
  }

  if (action === 'reschedule') {
    // Open app and send reschedule event
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(cs => {
        if (cs.length > 0) {
          cs[0].focus();
          cs[0].postMessage({ type: 'NOTIF_RESCHEDULE', tag: notification.tag, data });
        } else {
          clients.openWindow('/').then(c => {
            if (c) c.postMessage({ type: 'NOTIF_RESCHEDULE', tag: notification.tag, data });
          });
        }
      })
    );
    return;
  }

  // Default: focus/open the app
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      if (cs.length > 0) return cs[0].focus();
      return clients.openWindow('/');
    })
  );
});

/* ── Push event (future) ─────────────────────────────────────── */
self.addEventListener('push', e => {
  if (!e.data) return;
  const payload = e.data.json();
  e.waitUntil(
    self.registration.showNotification(payload.title || 'Secret To-Do', {
      body:    payload.body || '',
      icon:    '/favicon.svg',
      tag:     payload.tag || 'push',
      data:    payload.data || {},
      actions: payload.actions || [],
    })
  );
});

/* ── Background sync (keep-alive ping) ──────────────────────── */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
