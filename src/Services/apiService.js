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
    
    // For production, replace the API port/path with the frontend port
    // Assuming frontend runs on port 5173 or is served from the same domain
    const url = new URL(API_BASE_URL);
    
    // If it's the production domain, use the same domain but different port or path
    if (url.hostname.includes('prodchunca.in.net')) {
        return `${url.protocol}//${url.hostname}:5173`;
    }
    
    // Default fallback - same host, port 5173
    return `${url.protocol}//${url.hostname}:5173`;
};

export default apiClient;
