import apiClient from './apiClient';

/**
 * Exam API Service
 * Handles all exam-related API calls
 */

// ============= Profile =============

export const getExamProfile = async () => {
  const response = await apiClient.get('/exam/profile');
  return response.data;
};

export const updateExamProfile = async (profileData) => {
  const response = await apiClient.put('/exam/profile', profileData);
  return response.data;
};

// ============= Seat Plans =============

export const uploadSeatPlan = async (seatPlanData) => {
  const response = await apiClient.post('/exam/seat-plans', seatPlanData);
  return response.data;
};

export const getSeatPlans = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.academicYear) params.append('academicYear', filters.academicYear);
  if (filters.department) params.append('department', filters.department);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const response = await apiClient.get(`/exam/seat-plans?${params.toString()}`);
  return response.data;
};

export const getSeatPlanById = async (planId) => {
  const response = await apiClient.get(`/exam/seat-plans/${planId}`);
  return response.data;
};

export const updateSeatPlanVisibility = async (planId, isVisible) => {
  const response = await apiClient.patch(`/exam/seat-plans/${planId}/visibility`, { isVisible });
  return response.data;
};

export const deleteSeatPlan = async (planId) => {
  const response = await apiClient.delete(`/exam/seat-plans/${planId}`);
  return response.data;
};

// ============= Exam Results =============

export const uploadExamResult = async (resultData) => {
  const response = await apiClient.post('/exam/results', resultData);
  return response.data;
};

export const getExamResults = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.academicYear) params.append('academicYear', filters.academicYear);
  if (filters.department) params.append('department', filters.department);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const response = await apiClient.get(`/exam/results?${params.toString()}`);
  return response.data;
};

export const getExamResultById = async (resultId) => {
  const response = await apiClient.get(`/exam/results/${resultId}`);
  return response.data;
};

export const updateExamResultVisibility = async (resultId, isVisible) => {
  const response = await apiClient.patch(`/exam/results/${resultId}/visibility`, { isVisible });
  return response.data;
};

export const deleteExamResult = async (resultId) => {
  const response = await apiClient.delete(`/exam/results/${resultId}`);
  return response.data;
};

// ============= Notifications =============

export const pushNotification = async (notificationData) => {
  const response = await apiClient.post('/exam/notifications', notificationData);
  return response.data;
};

// ============= Filters =============

export const getFilterOptions = async () => {
  const response = await apiClient.get('/exam/filters');
  return response.data;
};

// ============= Utility Functions =============

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validate PDF file
 */
export const validatePDF = (file) => {
  if (!file) {
    throw new Error('No file selected');
  }
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size must be less than 10MB');
  }
  return true;
};
