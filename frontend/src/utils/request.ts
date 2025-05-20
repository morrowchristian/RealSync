// src/utils/request.ts
import { toast } from 'react-toastify';

const handleRequest = async <T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    toast.error(errorMessage);
    console.error(error);
    throw error;
  }
};

export default handleRequest;
