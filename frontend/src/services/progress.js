
import { fetchWithAuth } from './utils';

export const fetchStudentProgress = async () => {
  return await fetchWithAuth('/progress/my-topic-progress');
};

export const fetchAdminAnalyticsData = async (subject = '', level = '') => {
  const query = new URLSearchParams();
  if (subject) query.append('subject', subject);
  if (level) query.append('level', level);
  return await fetchWithAuth(`/progress/admin/analytics?${query.toString()}`);
};

export const fetchAllStudentProgress = async (subject = '') => {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return await fetchWithAuth(`/progress/all${query}`);
};

export const fetchProgressByStudent = async (userId) => {
  try {
    return await fetchWithAuth(`/progress/student/${userId}`);
  } catch (err) {
    console.error("Error fetching student progress:", err.message);
    throw new Error("Failed to fetch student progress");
  }
};

export const fetchSummaryStats = async (subject = "", userId = null) => {
  const query = new URLSearchParams();
  if (subject) query.append("subject", subject);
  if (userId) query.append("user_id", userId.toString());
  return await fetchWithAuth(`/progress/summary?${query.toString()}`);
};

export const fetchProgressSummary = async (userId) => {
  const res = await fetchWithAuth(`/progress/summary?user_id=${userId}`);
  return res || [];  // returns the list directly
};



export const downloadCSVExport = async () => {
  const response = await fetchWithAuth('/progress/export/csv');
  if (!response.ok) {
    throw new Error('Failed to fetch CSV export');
  }
  return await response.blob();
};


