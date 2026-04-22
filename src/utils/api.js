/**
 * API Wrapper for Bill Splitter
 */

export const api = {
  async createSession(name, date) {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date })
    });
    return res.json();
  },

  async getSession(id) {
    const res = await fetch(`/api/session?id=${id}`);
    return res.json();
  },

  async syncFull(sessionId) {
    const res = await fetch(`/api/sync?sessionId=${sessionId}`);
    return res.json();
  },

  async dispatch(sessionId, action, data = {}) {
    const res = await fetch(`/api/sync?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    return res.json();
  }
};
