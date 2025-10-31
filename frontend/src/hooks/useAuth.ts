import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  role: 'USER' | 'ADMIN';
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);

  const { data: user, isLoading: queryLoading, refetch } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
    retry: false,
  });

  useEffect(() => {
    setIsLoading(queryLoading);
  }, [queryLoading]);

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      await refetch();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user: user || null,
    isLoading,
    refetch,
    logout,
  };
};

