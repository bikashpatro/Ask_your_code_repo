// store/slices/llmSlice.ts
// Redux slice for configurable LLM provider settings

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LLMProvider = 'groq' | 'openai' | 'anthropic';

export interface LLMState {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

const initialState: LLMState = {
  provider: 'groq',
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  baseUrl: 'http://localhost:11434',
};

const llmSlice = createSlice({
  name: 'llm',
  initialState,
  reducers: {
    setLLMConfig(state, action: PayloadAction<Partial<LLMState>>) {
      return { ...state, ...action.payload };
    },
    resetLLMConfig() {
      return initialState;
    },
  },
});

export const { setLLMConfig, resetLLMConfig } = llmSlice.actions;
export default llmSlice.reducer;
