import { useState, useEffect } from 'react';

export interface UseQueryOptions {
  url: string;
  enabled?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  refetchInterval?: number;
  onError?: (error: Error) => void;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching data from API
 * @param options - Query configuration options
 * @returns Query result with data, loading, error states and refetch function
 */
export function useQuery<T = any>(options: UseQueryOptions): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Support both session/local storage keys used across the app
      const token =
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(options.url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    fetchData();

    // Setup refetch interval if specified
    if (options.refetchInterval && options.refetchInterval > 0) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [options.url, options.enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
