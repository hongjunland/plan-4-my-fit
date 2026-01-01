import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
}

const useUIStore = create<UIState>(() => ({
  isLoading: false,
}));

export default useUIStore;