import axios from 'axios';

export const mailscanApi = axios.create({
  baseURL: import.meta.env.VITE_MAILSCAN_API_URL,
});
