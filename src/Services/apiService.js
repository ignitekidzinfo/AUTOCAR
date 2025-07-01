import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8080';

const API_BASE_URL = 'https://sp80.prodchunca.in.net';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
