import axios from 'axios';

export interface AuthResponse {
  success: boolean;
  token: string;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  console.log('Attempting login with:', { username, password }); // Debug log
  
  try {
    const response = await axios.post('/api/login', { username, password });
    console.log('Login API response:', response.data); // Debug log
    
    const { token } = response.data;
    if (!token) {
      throw new Error('No token received');
    }
    
    localStorage.setItem('token', token);
    return response.data;
  } catch (error) {
    console.error('Login request failed:', error);
    throw error;
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const logout = (): void => {
  localStorage.removeItem('token');
};