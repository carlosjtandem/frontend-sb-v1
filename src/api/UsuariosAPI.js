import axios from 'axios';

// URL base de tu API de Django
const API_URL = 'https://web-production-d15e.up.railway.app/api/users/'; 

const api = axios.create({
    baseURL: API_URL,
});

//agregar el token en las cabeceras
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//manejar respuestas
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post('https://web-production-d15e.up.railway.app/api/users/token/refresh/', { refresh: refreshToken });
                    localStorage.setItem('access_token', response.data.access);
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return axios(originalRequest);
                } catch (err) {
                    console.error('Error al refrescar token:', err);
                    // Opcional: redirigir al login - PENDIENTE
                }
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}token/`, {
            username,
            password
        });
        const { access, refresh } = response.data;
        // Almacenar el token en localStorage
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        return access;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};

export default api;
