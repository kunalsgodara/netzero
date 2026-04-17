declare global {
  
  var __B44_DB__: {
    auth: {
      me: () => Promise<unknown>;
      logout: (redirectUrl?: string) => void;
      isAuthenticated: () => Promise<boolean>;
    };
    entities: Record<string, {
      list: (orderBy?: string, limit?: number) => Promise<unknown[]>;
      get: (id: string) => Promise<unknown>;
      create: (data: unknown) => Promise<unknown>;
      update: (id: string, data: unknown) => Promise<unknown>;
      delete: (id: string) => Promise<unknown>;
    }>;
    integrations: {
      Core: {
        InvokeLLM: (args: { prompt: string; response_json_schema?: object }) => Promise<unknown>;
        UploadFile: (file: File) => Promise<unknown>;
      };
    };
  };
}

export {};
