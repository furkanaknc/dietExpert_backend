export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
