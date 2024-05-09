import axios from 'axios';

export const customerIOApi = axios.create({
  baseURL: import.meta.env.VITE_CUSTOMER_IO_API_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_CUSTOMER_IO_API_KEY}`,
  },
});

export const mailscanApi = axios.create({
  baseURL: import.meta.env.VITE_MAILSCAN_API_URL,
});
