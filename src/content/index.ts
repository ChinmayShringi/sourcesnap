import type { SourceSnapSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/storage';

// Content script - runs in isolated context
// Responsible for:
// 1. Injecting the page-context script
// 2. Bridging messages between page and extension
// 3. Loading settings from chrome.storage

let settings: SourceSnapSettings = DEFAULT_SETTINGS;

// Inject the page-context script
function injectScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/index.js');
  script.type = 'module';
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
    // Send initial settings to injected script
    sendSettingsToPage();
  };
}

// Send settings to the page-context script
function sendSettingsToPage(): void {
  window.postMessage(
    { type: 'SOURCESNAP_SETTINGS_UPDATE', payload: settings },
    '*'
  );
}

// Load settings from chrome.storage
async function loadSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      settings = { ...DEFAULT_SETTINGS, ...result } as SourceSnapSettings;
      resolve();
    });
  });
}

// Listen for messages from the page-context script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  switch (event.data?.type) {
    case 'SOURCESNAP_GET_SETTINGS':
      sendSettingsToPage();
      break;
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;

  // Update local settings
  for (const key of Object.keys(changes)) {
    (settings as any)[key] = changes[key].newValue;
  }

  // Send updated settings to page
  sendSettingsToPage();
});

// Initialize
async function init(): Promise<void> {
  await loadSettings();
  injectScript();
  console.log('[SourceSnap] Content script initialized');
}

init();
