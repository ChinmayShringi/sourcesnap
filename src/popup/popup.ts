import type { SourceSnapSettings } from '../shared/types';
import { DEFAULT_SETTINGS, formatHotkey } from '../shared/storage';

// DOM elements
const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
const editorSelect = document.getElementById('editor') as HTMLSelectElement;
const customUrlField = document.getElementById('customUrlField') as HTMLDivElement;
const customUrlInput = document.getElementById('customEditorUrl') as HTMLInputElement;
const projectPathInput = document.getElementById('projectPathPrefix') as HTMLInputElement;
const showTooltipCheckbox = document.getElementById('showTooltip') as HTMLInputElement;
const disableAutoOpenCheckbox = document.getElementById('disableAutoOpen') as HTMLInputElement;
const hotkeyDisplay = document.getElementById('hotkeyDisplay') as HTMLDivElement;

// Current settings
let settings: SourceSnapSettings = DEFAULT_SETTINGS;

// Load settings from storage
async function loadSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      settings = { ...DEFAULT_SETTINGS, ...result } as SourceSnapSettings;
      updateUI();
      resolve();
    });
  });
}

// Update UI with current settings
function updateUI(): void {
  enabledCheckbox.checked = settings.enabled;
  editorSelect.value = settings.editor;
  customUrlInput.value = settings.customEditorUrl;
  projectPathInput.value = settings.projectPathPrefix;
  showTooltipCheckbox.checked = settings.showTooltip;
  disableAutoOpenCheckbox.checked = settings.disableAutoOpen;
  hotkeyDisplay.textContent = formatHotkey(settings.hotkey);

  // Show/hide custom URL field
  customUrlField.style.display = settings.editor === 'custom' ? 'block' : 'none';
}

// Save a single setting
async function saveSetting<K extends keyof SourceSnapSettings>(
  key: K,
  value: SourceSnapSettings[K]
): Promise<void> {
  settings[key] = value;
  await chrome.storage.sync.set({ [key]: value });
}

// Event listeners
enabledCheckbox.addEventListener('change', () => {
  saveSetting('enabled', enabledCheckbox.checked);
});

editorSelect.addEventListener('change', () => {
  saveSetting('editor', editorSelect.value);
  customUrlField.style.display = editorSelect.value === 'custom' ? 'block' : 'none';
});

customUrlInput.addEventListener('change', () => {
  saveSetting('customEditorUrl', customUrlInput.value);
});

projectPathInput.addEventListener('change', () => {
  saveSetting('projectPathPrefix', projectPathInput.value);
});

showTooltipCheckbox.addEventListener('change', () => {
  saveSetting('showTooltip', showTooltipCheckbox.checked);
});

disableAutoOpenCheckbox.addEventListener('change', () => {
  saveSetting('disableAutoOpen', disableAutoOpenCheckbox.checked);
});

// Initialize
loadSettings();
