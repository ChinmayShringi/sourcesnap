// Source location information extracted from frameworks
export interface SourceInfo {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  componentName?: string;
  projectPath?: string;
}

// Component in the hierarchy tree
export interface ComponentNode {
  name: string;
  source: SourceInfo | null;
  props?: Record<string, any>;
  isCurrentTarget?: boolean;
}

// Extended element info for UI display
export interface ElementInfo {
  source: SourceInfo;
  componentName: string;
  tagName: string;
  boundingBox: DOMRect;
  // Enhanced info
  hierarchy?: ComponentNode[];  // Parent components
  props?: Record<string, any>;  // Component props
  fiber?: any;                   // Raw fiber for debugging
  // For live editing
  element?: HTMLElement;         // Reference to actual DOM element
  className?: string;            // Current className
  style?: Record<string, string>; // Current inline styles
}

// Hotkey configuration
export interface HotkeyConfig {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

// User settings stored in chrome.storage
export interface SourceSnapSettings {
  editor: string;
  customEditorUrl: string;
  hotkey: HotkeyConfig;
  projectPathPrefix: string;
  enabled: boolean;
  showTooltip: boolean;
  disableAutoOpen: boolean;  // If true, clicking shows panel only (no auto-open in IDE)
}

// Messages between content script and injected script
export type MessageType =
  | { type: 'SOURCESNAP_OPEN_EDITOR'; payload: SourceInfo }
  | { type: 'SOURCESNAP_SETTINGS_UPDATE'; payload: Partial<SourceSnapSettings> }
  | { type: 'SOURCESNAP_GET_SETTINGS' }
  | { type: 'SOURCESNAP_SETTINGS_RESPONSE'; payload: SourceSnapSettings };

// Framework adapter interface
export interface FrameworkAdapter {
  id: string;
  name: string;
  priority: number;
  isApplicable(): boolean;
  getSourceInfo(element: HTMLElement): SourceInfo | null;
  getElementInfo(element: HTMLElement): ElementInfo | null;
}
