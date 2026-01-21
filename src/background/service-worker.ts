import { DEFAULT_SETTINGS } from '../shared/storage';

// Background service worker
// Responsible for:
// 1. Extension installation/update handling
// 2. Setting default preferences

// On extension install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  } else if (details.reason === 'update') {
    // Merge new default settings with existing
    const existing = await chrome.storage.sync.get(null);
    const merged = { ...DEFAULT_SETTINGS, ...existing };
    await chrome.storage.sync.set(merged);
  }
});

// Log when service worker starts
