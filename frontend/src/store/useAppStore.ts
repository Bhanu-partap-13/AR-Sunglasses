import { create } from 'zustand'

interface CustomizationState {
  selectedModel: string
  selectedFrameColor: number
  selectedLensTint: number
  selectedEnvironment: number
  lensTransparency: number
}

interface AppState {
  isLoading: boolean
  loadingProgress: number
  isMobileMenuOpen: boolean
  customization: CustomizationState
  
  // Actions
  setIsLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  setSelectedModel: (model: string) => void
  setSelectedFrameColor: (index: number) => void
  setSelectedLensTint: (index: number) => void
  setSelectedEnvironment: (index: number) => void
  setLensTransparency: (value: number) => void
  resetCustomization: () => void
}

const initialCustomization: CustomizationState = {
  selectedModel: '/models/glasses1.glb',
  selectedFrameColor: 0,
  selectedLensTint: 0,
  selectedEnvironment: 0,
  lensTransparency: 0.7,
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  loadingProgress: 0,
  isMobileMenuOpen: false,
  customization: initialCustomization,
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  setSelectedModel: (model) => 
    set((state) => ({ 
      customization: { ...state.customization, selectedModel: model } 
    })),
    
  setSelectedFrameColor: (index) => 
    set((state) => ({ 
      customization: { ...state.customization, selectedFrameColor: index } 
    })),
    
  setSelectedLensTint: (index) => 
    set((state) => ({ 
      customization: { ...state.customization, selectedLensTint: index } 
    })),
    
  setSelectedEnvironment: (index) => 
    set((state) => ({ 
      customization: { ...state.customization, selectedEnvironment: index } 
    })),
    
  setLensTransparency: (value) => 
    set((state) => ({ 
      customization: { ...state.customization, lensTransparency: value } 
    })),
    
  resetCustomization: () => 
    set({ customization: initialCustomization }),
}))
