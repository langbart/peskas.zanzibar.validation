import axios from 'axios';
import { getToken } from './auth';
import type { SurveyFlag } from '../types/survey';

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

export async function fetchSurveyFlags(): Promise<SurveyFlag[]> {
  const token = getToken();
  const response = await axios.get('/api/surveys', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}