// src/hooks/use-toast.js
import { toast as reactToast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const toast = {
  success: (msg) => reactToast.success(msg),
  error: (msg) => reactToast.error(msg),
  info: (msg) => reactToast.info(msg),
  warn: (msg) => reactToast.warn(msg),
};
