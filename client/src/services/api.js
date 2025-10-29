import axios from 'axios';

const API_BASE = 'https://neo-auction.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
};

export default api;