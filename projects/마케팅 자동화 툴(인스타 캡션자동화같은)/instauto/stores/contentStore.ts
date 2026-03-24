// stores/contentStore.ts
// Zustand 상태 관리 - 오늘의 콘텐츠

import { create } from 'zustand';
import { ContentGenerationStep } from '@/types';

export type GenerationStatus =
  | 'idle'
  | 'start'
  | 'caption_generating'
  | 'caption_done'
  | 'image_generating'
  | 'image_done'
  | 'saving'
  | 'complete'
  | 'error';

interface Content {
  id: string;
  caption: string;
  editedCaption?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  status: 'GENERATING' | 'READY' | 'PUBLISHED' | 'FAILED';
  regenerateCount?: number;
  targetDate?: string;
  publishedAt?: string | null;
  createdAt?: string;
}

interface RegenerateInfo {
  canRegenerate: boolean;
  remaining: number;
  limit: number;
}

interface ContentStore {
  // 상태
  generationStatus: GenerationStatus;
  generationMessage: string | null;
  progress: number;
  streamedCaption: string;
  currentContent: Content | null;
  error: string | null;
  errorCode: string | null;
  regenerateInfo: RegenerateInfo | null;

  // 액션
  setGenerationStatus: (status: GenerationStatus, message?: string) => void;
  setProgress: (progress: number) => void;
  setStreamedCaption: (caption: string) => void;
  appendStreamedCaption: (chunk: string) => void;
  setCurrentContent: (content: Content | null) => void;
  updateCaption: (editedCaption: string) => void;
  setError: (error: string | null, code?: string | null) => void;
  setRegenerateInfo: (info: RegenerateInfo | null) => void;
  reset: () => void;
}

const initialState = {
  generationStatus: 'idle' as GenerationStatus,
  generationMessage: null as string | null,
  progress: 0,
  streamedCaption: '',
  currentContent: null as Content | null,
  error: null as string | null,
  errorCode: null as string | null,
  regenerateInfo: null as RegenerateInfo | null,
};

export const useContentStore = create<ContentStore>((set) => ({
  ...initialState,

  setGenerationStatus: (status, message) => {
    // 단계별 진행률 매핑
    const progressMap: Record<GenerationStatus, number> = {
      idle: 0,
      start: 5,
      caption_generating: 20,
      caption_done: 40,
      image_generating: 50,
      image_done: 80,
      saving: 90,
      complete: 100,
      error: 0,
    };

    set({
      generationStatus: status,
      generationMessage: message || null,
      progress: progressMap[status],
      error: status === 'error' ? message || 'An error occurred' : null,
    });
  },

  setProgress: (progress) => set({ progress }),

  setStreamedCaption: (caption) => set({ streamedCaption: caption }),

  appendStreamedCaption: (chunk) =>
    set((state) => ({ streamedCaption: state.streamedCaption + chunk })),

  setCurrentContent: (content) =>
    set({
      currentContent: content,
      generationStatus: content ? 'complete' : 'idle',
      progress: content ? 100 : 0,
      error: null,
    }),

  updateCaption: (editedCaption) =>
    set((state) => ({
      currentContent: state.currentContent
        ? { ...state.currentContent, editedCaption }
        : null,
    })),

  setError: (error, code = null) =>
    set({
      error,
      errorCode: code,
      generationStatus: error ? 'error' : 'idle',
      generationMessage: error,
    }),

  setRegenerateInfo: (regenerateInfo) => set({ regenerateInfo }),

  reset: () => set(initialState),
}));
