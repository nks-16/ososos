import axios from 'axios';
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

export default {
  post: async (path, body, token) => {
    const res = await API.post(path, body, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.data;
  },
  get: async (path, token) => {
    const res = await API.get(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.data;
  }
};
