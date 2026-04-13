// types/index.ts
// Shared TypeScript interfaces for the RepoBrainAI app

export interface Repository {
  id: string;
  name: string;
  path: string;
  language: string;
  status: 'indexed' | 'indexing' | 'pending';
  filesIndexed?: number;
  lastIndexed?: string;
}

export interface IndexedFile {
  id: string;
  name: string;
  path: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeBlock?: {
    language: string;
    code: string;
  };
  mermaidDiagram?: string;
  citations?: string[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  repoId: string;
  messages: ChatMessage[];
}