import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  role: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  smsCount?: number;
  batchId?: string;
}

interface LoginData {
  phoneNumber: string;
  password: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);

  // Get current user from session
  const { data: user, isLoading: queryLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Check localStorage for user data and handle auth errors
  useEffect(() => {
    if (error) {
      localStorage.removeItem('user');
      queryClient.setQueryData(['/api/auth/user'], null);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser && !user) {
        try {
          const parsedUser = JSON.parse(storedUser);
          queryClient.setQueryData(['/api/auth/user'], parsedUser);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    }
    setIsLoading(false);
  }, [user, error]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      console.log('🔐 useAuth: Starting login mutation with data:', data);
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();
      console.log('🔐 useAuth: Login API response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ useAuth: Login mutation successful, data:', data);
      if (data?.user) {
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update query cache
        queryClient.setQueryData(['/api/auth/user'], data.user);
        console.log('✅ useAuth: User stored in localStorage and cache');
      }
    },
    onError: (error: any) => {
      console.error('❌ useAuth: Login mutation failed:', error);
      localStorage.removeItem('user');
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      localStorage.removeItem('user');
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
      window.location.href = '/';
    }
  });

  const isAuthenticated = !!user;

  return {
    user,
    isLoading: isLoading || queryLoading,
    isAuthenticated,
    loginMutation,
    logoutMutation,
    error
  };
}
