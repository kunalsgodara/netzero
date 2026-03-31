import { httpFetch } from './httpClient';

export const aiService = {
  invokeAI: (prompt: string, schema?: object) =>
    httpFetch('/api/integrations/llm/invoke', {
      method: 'POST',
      body: JSON.stringify({ prompt, response_json_schema: schema }),
    }),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpFetch('/api/integrations/files/upload', { method: 'POST', body: formData });
  },
};
