import { create } from 'zustand';
import { logger } from '../utils/logger';
import { routinesService } from '../services/routines';
import type { Routine } from '../types';

interface RoutineState {
  routines: Routine[];
  activeRoutine: Routine | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadRoutines: (userId: string) => Promise<void>;
  addRoutine: (routine: Routine) => Promise<void>;
  setActiveRoutine: (routine: Routine) => Promise<void>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  clearError: () => void;
}

const useRoutineStore = create<RoutineState>((set) => ({
  routines: [],
  activeRoutine: null,
  isLoading: false,
  error: null,
  
  loadRoutines: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const routines = await routinesService.getUserRoutines(userId);
      const activeRoutine = routines.find(r => r.isActive) || null;
      
      set({ 
        routines, 
        activeRoutine,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '루틴을 불러오는 중 오류가 발생했습니다.';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },
  
  addRoutine: async (routine: Routine) => {
    set({ isLoading: true, error: null });
    try {
      // AI에서 생성된 루틴을 데이터베이스에 저장
      const savedRoutine = await routinesService.createRoutine(routine.userId, {
        name: routine.name,
        settings: routine.settings,
        workouts: routine.workouts
      });
      
      set((state) => ({
        routines: [...state.routines, savedRoutine],
        isLoading: false
      }));
      
      logger.debug('루틴이 성공적으로 저장되었습니다', { 
        routineName: savedRoutine.name 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '루틴 저장 중 오류가 발생했습니다.';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },
  
  setActiveRoutine: async (routine: Routine) => {
    set({ isLoading: true, error: null });
    try {
      await routinesService.activateRoutine(routine.userId, routine.id);
      
      set((state) => ({
        routines: state.routines.map(r => ({
          ...r,
          isActive: r.id === routine.id
        })),
        activeRoutine: { ...routine, isActive: true },
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '루틴 활성화 중 오류가 발생했습니다.';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateRoutine: async (id: string, updates: Partial<Routine>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRoutine = await routinesService.updateRoutine(id, {
        name: updates.name,
        settings: updates.settings,
        isActive: updates.isActive
      });
      
      set((state) => ({
        routines: state.routines.map(r => 
          r.id === id ? updatedRoutine : r
        ),
        activeRoutine: state.activeRoutine?.id === id 
          ? updatedRoutine
          : state.activeRoutine,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '루틴 수정 중 오류가 발생했습니다.';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteRoutine: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await routinesService.deleteRoutine(id);
      
      set((state) => ({
        routines: state.routines.filter(r => r.id !== id),
        activeRoutine: state.activeRoutine?.id === id ? null : state.activeRoutine,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '루틴 삭제 중 오류가 발생했습니다.';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));

export { useRoutineStore };
export default useRoutineStore;