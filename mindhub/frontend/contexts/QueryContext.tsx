'use client';

import { useState, createContext, useContext } from 'react';

// Simple QueryContext replacement for MVP
const QueryContext = createContext<any>(null);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queries] = useState(() => ({
    cache: new Map(),
    fetch: async (key: string, fetcher: () => Promise<any>) => {
      if (queries.cache.has(key)) {
        return queries.cache.get(key);
      }
      const result = await fetcher();
      queries.cache.set(key, result);
      return result;
    },
    invalidate: (key: string) => {
      queries.cache.delete(key);
    }
  }));

  return (
    <QueryContext.Provider value={queries}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery(key: string, fetcher: () => Promise<any>) {
  const queries = useContext(QueryContext);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await queries.fetch(key, fetcher);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}