import axios from 'axios';

// Use the environment variable like in the TypeScript version
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// const API_BASE_URL = 'https://app.prodchunca.in.net/'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
