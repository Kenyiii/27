export enum AppView {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  EXTRACT = 'EXTRACT',
  GALLERY = 'GALLERY',
  INSPIRATION = 'INSPIRATION',
  ENHANCE = 'ENHANCE'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  model: string;
}

export interface InspirationItem {
  uri: string;
  title: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Use optional modifier to resolve "All declarations of 'aistudio' must have identical modifiers"
    // as it may be declared as optional in the global context by the environment.
    aistudio?: AIStudio;
  }
}