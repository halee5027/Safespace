import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL
});

export const endpoints = {
  users: '/users',
  seedDemo: '/seed-demo',
  sendMessage: '/send-message',
  messages: '/messages',
  uploadContent: '/upload-content',
  feed: '/feed',
  alerts: (userId) => `/alerts/${userId}`,
  dashboard: '/dashboard/metrics',
  adminFlags: '/admin/flags',
  reviewMessage: (messageId) => `/admin/review/message/${messageId}`,
  reviewPost: (postId) => `/admin/review/post/${postId}`,
  banUser: (userId) => `/admin/ban/${userId}`,
  report: '/reports'
};

export const API_BASE_URL = API_URL;
