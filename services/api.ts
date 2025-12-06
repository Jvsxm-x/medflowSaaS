
import { API_BASE_URL } from '../constants';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('access_token');
  const headers: any = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
 if (isMultipart) {
    // Let browser set Content-Type with proper boundary
    headers['content-type'] = 'multipart/form-data';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Simple logger to track API activity for the Admin Dashboard
const logActivity = (method: string, endpoint: string, status: number) => {
  try {
    const logs = JSON.parse(sessionStorage.getItem('system_logs') || '[]');
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      status,
      message: `${method} request to ${endpoint} - ${status === 200 || status === 201 ? 'Success' : 'Failed'}`
    };
    // Keep last 50 logs
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    sessionStorage.setItem('system_logs', JSON.stringify(updatedLogs));
  } catch (e) {
    // Ignore logging errors
  }
};

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      logActivity('GET', endpoint, response.status);
      if (!response.ok) throw new Error(`Error fetching ${endpoint}`);
      return response.json();
    } catch (error) {
      logActivity('GET', endpoint, 500);
      throw error;
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      logActivity('POST', endpoint, response.status);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Error posting to ${endpoint}`);
      }
      return response.json();
    } catch (error) {
      logActivity('POST', endpoint, 500);
      throw error;
    }
  },

  put: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      logActivity('PUT', endpoint, response.status);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Error updating ${endpoint}`);
      }
      return response.json();
    } catch (error) {
      logActivity('PUT', endpoint, 500);
      throw error;
    }
  },

  patch: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      logActivity('PATCH', endpoint, response.status);
      if (!response.ok) throw new Error(`Error patching ${endpoint}`);
      return response.json();
    } catch (error) {
      logActivity('PATCH', endpoint, 500);
      throw error;
    }
  },

  delete: async (endpoint: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      logActivity('DELETE', endpoint, response.status);
      if (!response.ok) throw new Error(`Error deleting ${endpoint}`);
    } catch (error) {
      logActivity('DELETE', endpoint, 500);
      throw error;
    }
  },

  // New upload method
  upload: async <T>(endpoint: string, file: File): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(true), // true = do not set Content-Type, let browser set boundary
            body: formData
        });
        logActivity('UPLOAD', endpoint, response.status);
        if (!response.ok) throw new Error(`Error uploading to ${endpoint}`);
        return response.json();
    } catch (error) {
        logActivity('UPLOAD', endpoint, 500);
        throw error;
    }
  }
};
