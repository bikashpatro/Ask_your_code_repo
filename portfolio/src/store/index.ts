// store/index.ts
// Redux store with redux-persist
// Root key kept as "repobrainai-v1" to preserve existing chat history.
// indexedFiles excluded via nested repo config (too large for localStorage).

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore, persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import repoReducer from './slices/repoSlice';
import chatReducer from './slices/chatSlice';
import llmReducer from './slices/llmSlice';

// Nested config for repo slice — blacklists indexedFiles so large file lists
// don't overflow localStorage (5 MB limit).
const repoPersistConfig = {
  key: 'repo-nested',
  storage,
  blacklist: ['indexedFiles', 'repoPath'],
};

const rootReducer = combineReducers({
  repo: persistReducer(repoPersistConfig, repoReducer),
  chat: chatReducer,
  llm: llmReducer,
});

// Root config — same key as before so existing chat history is preserved.
const rootPersistConfig = {
  key: 'repobrainai-v1',
  storage,
  whitelist: ['chat', 'repo', 'llm'],
};

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;