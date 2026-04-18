/* eslint-disable prettier/prettier */
import axios from 'axios';
const host = import.meta.env.VITE_API_URL;

const http = axios.create({
  baseURL: host, ///esto cambia en archivo .ENV
});

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
