import { GoogleGenAI } from "@google/genai";

/**
 * Shared Gemini Client Instance
 */
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Executes an async operation with exponential backoff retry logic.
 * Specifically targets 503 (Overloaded) and 429 (Rate Limit) errors.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the provided async operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Determine if the error is a transient server-side issue that warrants a retry
      const isRetryable = 
        error?.status === "UNAVAILABLE" || 
        error?.code === 503 || 
        error?.code === 429 ||
        String(error).includes("503") ||
        String(error).includes("429") ||
        String(error).includes("overloaded");

      // If not retryable or max attempts reached, propagate the error
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate exponential backoff delay with random jitter to prevent synchronized retries
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Gemini API overloaded. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
      
      // Wait for the calculated duration before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
