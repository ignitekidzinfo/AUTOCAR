import axios from 'axios';

// Use the environment variable like in the TypeScript version
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const API_BASE_URL = 'https://app.prodchunca.in.net/'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Utility function to get the frontend base URL
export const getFrontendBaseUrl = () => {
    // If we're in development or the API is localhost, use localhost:5173
    if (API_BASE_URL.includes('localhost') || process.env.NODE_ENV === 'development') {
        return 'http://localhost:5173';
    }
    
    // For production, map the API URL to the frontend URL
    if (API_BASE_URL.includes('prodchunca.in.net')) {
        // Map app.prodchunca.in.net to autocarcares.com
        return 'https://autocarcares.com';
    }
    
    // Default fallback - try to construct from API URL
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.hostname}`;
};

export default apiClient;
