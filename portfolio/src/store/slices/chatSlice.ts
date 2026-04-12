// store/slices/chatSlice.ts
// Redux slice for managing chat session state

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, ChatSession } from '@/types';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
}

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  isLoading: false,
};

// Redux slice for chat session management
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add a new message to the active session
    addMessage(state, action: PayloadAction<{ sessionId: string; message: ChatMessage }>) {
      const session = state.sessions.find((s) => s.id === action.payload.sessionId);
      if (session) session.messages.push(action.payload.message);
    },
    // Create a new chat session
    newSession(state, action: PayloadAction<ChatSession>) {
      state.sessions.push(action.payload);
      state.activeSessionId = action.payload.id;
    },
    // Set the loading state while waiting for AI response
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    // Switch active session
    setActiveSession(state, action: PayloadAction<string>) {
      state.activeSessionId = action.payload;
    },
    // Delete a session by id
    deleteSession(state, action: PayloadAction<string>) {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0]?.id ?? null;
      }
    },
  },
});

export const { addMessage, newSession, setLoading, setActiveSession, deleteSession } = chatSlice.actions;
export default chatSlice.reducer;