export interface GeminiChatMessage {
  role: 'user' | 'model';
  parts: string;
}
