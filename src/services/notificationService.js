/**
 * Notification Service — wraps browser Notification API
 * Works fully offline. No server needed.
 */

export const NotifService = {
  /** Request permission. Returns 'granted' | 'denied' | 'default' */
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
  },

  get permission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  get supported() {
    return 'Notification' in window;
  },

  /** Fire an immediate notification */
  fire(title, body = '', icon = '/favicon.svg', tag = '') {
    if (Notification.permission !== 'granted') return null;
    return new Notification(title, { body, icon, tag, silent: false });
  },

  /** Schedule a notification at a specific time today (HH:MM string).
   *  Returns the timeout ID so it can be cancelled. */
  scheduleAtTime(timeStr, title, body = '', tag = '') {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) return null; // already passed today

    const delay = target - now;
    return setTimeout(() => {
      NotifService.fire(title, body, '/favicon.svg', tag);
    }, delay);
  },

  /** Schedule repeating notification every `intervalMs` */
  scheduleInterval(intervalMs, title, body = '', tag = '') {
    return setInterval(() => {
      NotifService.fire(title, body, '/favicon.svg', tag);
    }, intervalMs);
  },
};
