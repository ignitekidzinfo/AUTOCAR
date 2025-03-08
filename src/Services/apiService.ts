import axios from 'axios';

const API_BASE_URL = 'https://carauto01-production-8b0b.up.railway.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
