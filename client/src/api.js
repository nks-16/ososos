import axios from 'axios';
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

const api = {
  post: async (path, body, token) => {
    const res = await API.post(path, body, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.data;
  },
  get: async (path, token) => {
    const res = await API.get(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.data;
  },

  // Round 2 - Banker's Algorithm
  bankers: {
    initialize: async (sessionId) => {
      const res = await API.post('/bankers/initialize', { sessionId });
      return res.data;
    },
    getState: async (sessionId) => {
      const res = await API.get(`/bankers/state/${sessionId}`);
      return res.data;
    },
    checkSafety: async (sessionId) => {
      const res = await API.post('/bankers/check-safety', { sessionId });
      return res.data;
    },
    requestResources: async (sessionId, processIndex, request) => {
      const res = await API.post('/bankers/request', { sessionId, processIndex, request });
      return res.data;
    },
    releaseResources: async (sessionId, processIndex, release) => {
      const res = await API.post('/bankers/release', { sessionId, processIndex, release });
      return res.data;
    },
    reset: async (sessionId) => {
      const res = await API.post('/bankers/reset', { sessionId });
      return res.data;
    },
    complete: async (sessionId) => {
      const res = await API.post('/bankers/complete', { sessionId });
      return res.data;
    }
  },

  // Round 3 - Quiz
  round3: {
    initialize: async (sessionId) => {
      const res = await API.post('/round3/initialize', { sessionId });
      return res.data;
    },
    getState: async (sessionId) => {
      const res = await API.get(`/round3/state/${sessionId}`);
      return res.data;
    },
    submitAnswer: async (sessionId, passageIndex, questionIndex, answer) => {
      const res = await API.post('/round3/submit-answer', { sessionId, passageIndex, questionIndex, answer });
      return res.data;
    }
  },

  // User Progress
  progress: {
    getProgress: async (username) => {
      const res = await API.get(`/progress/progress/${username}`);
      return res.data;
    },
    completeRound: async (username, round, score) => {
      const res = await API.post('/progress/complete-round', { username, round, score });
      return res.data;
    },
    canAccess: async (username, round) => {
      const res = await API.get(`/progress/can-access/${username}/${round}`);
      return res.data;
    },
    getLeaderboard: async () => {
      const res = await API.get('/progress/leaderboard');
      return res.data;
    }
  }
};

export default api;
