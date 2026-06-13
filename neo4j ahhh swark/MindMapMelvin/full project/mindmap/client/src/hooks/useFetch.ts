/* eslint-disable no-unsafe-finally */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

const useFetch = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetchData = async (url: string, options?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/${url}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setData(data);
      return data;
    } catch (error) {
      setError(error);
      return error;
    } finally {
      setLoading(false);
      //   return null;
    }
  };

  return { data, loading, error, fetchData };
};

export default useFetch;
