import type { SourceSnapSettings, HotkeyConfig } from './types';

// Default settings
export const DEFAULT_SETTINGS: SourceSnapSettings = {
  editor: 'cursor',
  customEditorUrl: '',
  hotkey: {
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  },
  projectPathPrefix: '',
  enabled: true,
  showTooltip: true,
  disableAutoOpen: false,  // By default, clicking opens IDE automatically
};

// Get settings from chrome.storage
export async function getSettings(): Promise<SourceSnapSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...result } as SourceSnapSettings);
    });
  });
}

// Save settings to chrome.storage
export async function saveSettings(settings: Partial<SourceSnapSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, resolve);
  });
}

// Check if hotkey combination is pressed
export function isHotkeyPressed(event: MouseEvent | KeyboardEvent, hotkey: HotkeyConfig): boolean {
  return (
    event.altKey === hotkey.altKey &&
    event.ctrlKey === hotkey.ctrlKey &&
    event.metaKey === hotkey.metaKey &&
    event.shiftKey === hotkey.shiftKey
  );
}

// Format hotkey for display
export function formatHotkey(hotkey: HotkeyConfig): string {
  const parts: string[] = [];
  if (hotkey.ctrlKey) parts.push('Ctrl');
  if (hotkey.altKey) parts.push('Alt');
  if (hotkey.shiftKey) parts.push('Shift');
  if (hotkey.metaKey) parts.push('Cmd');
  return parts.join(' + ') + ' + Click';
}
