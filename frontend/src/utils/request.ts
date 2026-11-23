// src/utils/request.ts
import { toast } from 'react-toastify';
import { extractErrorMessage } from './trial';

const handleRequest = async <T>(
  fn: () => Promise<T>,
  errorMessage: string,
  opts?: { silent?: boolean }
): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    // Prefer the backend's plain message (e.g. a quota or trial-expired
    // error) over the generic fallback — never raw JSON.
    // `silent` skips the toast: callers that own the error display
    // (lead/contract forms) surface the message themselves so the user
    // does not get the same error toasted twice.
    if (!opts?.silent) {
      toast.error(extractErrorMessage(error, errorMessage));
    }
    console.error(error);
    throw error;
  }
};

export default handleRequest;
