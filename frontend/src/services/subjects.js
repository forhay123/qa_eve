
import { fetchWithAuth } from './utils';

export const fetchSubjects = async (level, department = '', role = '') => {
  const normalizedLevel = level?.trim().toLowerCase();
  const normalizedDept = department && department.toLowerCase() !== 'general' ? department.trim().toLowerCase() : '';
  const normalizedRole = role?.trim().toLowerCase();

  if (!normalizedLevel) {
    throw new Error('Level is required to fetch subjects');
  }

  const isSeniorLevel = ['ss1', 'ss2', 'ss3'].includes(normalizedLevel);

  if (normalizedRole === 'admin') {
    let endpoint = `/subjects/${normalizedLevel}`;
    if (isSeniorLevel && normalizedDept) {
      endpoint += `?department=${encodeURIComponent(normalizedDept)}`;
    }
    return await fetchWithAuth(endpoint);
  }

  if (isSeniorLevel) {
    let endpoint = `/subjects/${normalizedLevel}`;
    if (normalizedDept) {
      endpoint += `?department=${encodeURIComponent(normalizedDept)}`;
    }
    return await fetchWithAuth(endpoint);
  }

  return await fetchWithAuth(`/subjects/${normalizedLevel}`);
};

export const deleteSubject = async (id) => {
  return await fetchWithAuth(`/subjects/${id}`, 'DELETE');
};

export const updateSubject = async (id, payload) => {
  return await fetchWithAuth(`/subjects/${id}`, 'PUT', payload);
};

export const fetchSubjectsByLevel = async (level, department = '') => {
  if (!level) throw new Error('Level is required to fetch subjects');
  const normalized = level.trim().toLowerCase();

  if (['ss1', 'ss2', 'ss3'].includes(normalized)) {
    if (!department || department === 'General') {
      return await fetchWithAuth(`/subjects/${normalized}`);
    }
    return await fetchWithAuth(`/subjects/${normalized}?department=${encodeURIComponent(department)}`);
  }

  return await fetchWithAuth(`/subjects/${normalized}`);
};

export const getSubjectsWithStudentProgress = async () => {
  return await fetchWithAuth('/teacher/subjects-with-students-progress');
};

export const fetchAllSubjectsForAdmin = async (level, department = '') => {
  if (!level) throw new Error('Level parameter is required');
  const query = department ? `?level=${level}&department=${department}` : `?level=${level}`;
  return await fetchWithAuth(`/subjects/admin/subjects${query}`);
};

export const getAllSubjects = async (level, department = "") => {
  if (!level) throw new Error("Level is required for getAllSubjects");
  const params = new URLSearchParams({ level });
  if (department) params.append("department", department);
  return await fetchWithAuth(`/subjects/admin/subjects?${params.toString()}`);
};

export const fetchStudentSubjects = async (level, department) => {
  const normalizedLevel = level.trim().toLowerCase();
  const normalizedDept = department?.trim().toLowerCase();
  return await fetchWithAuth(`/subjects/student-subjects?level=${normalizedLevel}&department=${normalizedDept}`);
};

export const getAllSubjectsAdmin = async () => {
  return await fetchWithAuth('/subjects/admin/subjects');
};

export const getSubjectsForStudentLevel = async (level) => {
  return await fetchWithAuth(`/subjects/${level}`);
};

export const getTotalSubjectsCount = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return await fetchWithAuth(`/subjects/admin/subjects/count?${params}`);
};
