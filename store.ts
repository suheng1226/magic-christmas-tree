import { create } from 'zustand';

export enum HandState {
  UNKNOWN = 'UNKNOWN',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PINCH = 'PINCH',
}

export interface PhotoData {
  id: string;
  url: string;
}

interface AppState {
  handState: HandState;
  setHandState: (state: HandState) => void;
  
  photos: PhotoData[];
  addPhoto: (url: string) => void;
  addPhotos: (urls: string[]) => void;
  
  activePhotoId: string | null;
  setActivePhotoId: (id: string | null) => void;
  
  // For the specific pinch interaction
  nextPhotoIndex: number;
  cycleNextPhoto: () => void;
  
  isDebug: boolean;
  toggleDebug: () => void;
}

export const useStore = create<AppState>((set) => ({
  handState: HandState.UNKNOWN,
  setHandState: (state) => set({ handState: state }),
  
  photos: [],
  addPhoto: (url) => set((state) => ({ photos: [...state.photos, { id: Math.random().toString(36).substr(2, 9), url }] })),
  addPhotos: (urls) => set((state) => ({ 
      photos: [...state.photos, ...urls.map(url => ({ id: Math.random().toString(36).substr(2, 9), url }))] 
  })),
  
  activePhotoId: null,
  setActivePhotoId: (id) => set({ activePhotoId: id }),
  
  nextPhotoIndex: 0,
  cycleNextPhoto: () => set((state) => ({ nextPhotoIndex: (state.nextPhotoIndex + 1) % (state.photos.length || 1) })),
  
  isDebug: false,
  toggleDebug: () => set((state) => ({ isDebug: !state.isDebug })),
}));