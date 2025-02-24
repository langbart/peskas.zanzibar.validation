import axios from 'axios';
import { getToken } from './auth';

export interface SurveyResponse {
  submission_id: string;
  catches: Array<{
    n_catch: number;
    alert_flag?: string;
  }>;
  total_alerts: number;
}

export async function login(username: string, password: string) {
  const response = await axios.post('/api/login', { username, password });
  return response.data;
}

export async function fetchSurveyFlags(): Promise<SurveyResponse[]> {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.get('/api/surveys', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('API Response:', response.data); // Debug log
    return response.data.data || [];
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}