// store/slices/repoSlice.ts
// Redux slice for managing repository state

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Repository, IndexedFile } from '@/types';

interface RepoState {
  repositories: Repository[];
  activeRepo: Repository | null;
  indexedFiles: IndexedFile[];
  repoPath: string;
}

const initialState: RepoState = {
  repositories: [],
  activeRepo: null,
  indexedFiles: [],
  repoPath: '',
};

// Redux slice for repository management
const repoSlice = createSlice({
  name: 'repo',
  initialState,
  reducers: {
    // Set the active repository
    setActiveRepo(state, action: PayloadAction<Repository>) {
      state.activeRepo = action.payload;
    },
    // Update the typed repo path
    setRepoPath(state, action: PayloadAction<string>) {
      state.repoPath = action.payload;
    },
    // Add a new repository to the list
    addRepository(state, action: PayloadAction<Repository>) {
      state.repositories.unshift(action.payload);
    },
    // Clear all repositories
    clearRepositories(state) {
      state.repositories = [];
    },
    // Replace the indexed files list
    setIndexedFiles(state, action: PayloadAction<IndexedFile[]>) {
      state.indexedFiles = action.payload;
    },
  },
});

export const { setActiveRepo, setRepoPath, addRepository, clearRepositories, setIndexedFiles } = repoSlice.actions;
export default repoSlice.reducer;