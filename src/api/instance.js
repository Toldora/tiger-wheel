import axios from 'axios';

export const turboApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const wavixApi = axios.create({
  baseURL: import.meta.env.VITE_WAVIX_API_URL,
});
