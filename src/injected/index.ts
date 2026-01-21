import type { SourceInfo, SourceSnapSettings, HotkeyConfig } from '../shared/types';
import { buildEditorUrl } from '../shared/editors';
import { Overlay } from '../overlay/Overlay';
import { ReactAdapter } from './adapters/react';
import { VueAdapter } from './adapters/vue';
import { SvelteAdapter } from './adapters/svelte';
import { SolidAdapter } from './adapters/solid';
import { PreactAdapter } from './adapters/preact';
import { DataAttributeAdapter } from './adapters/data-attrs';
import type { FrameworkAdapter } from './adapters/interface';

class SourceSnap {
  private adapters: FrameworkAdapter[];
  private overlay: Overlay;
  private settings: SourceSnapSettings;
  private hotkeyPressed: boolean = false;
  private currentElement: HTMLElement | null = null;
  private lockedElement: HTMLElement | null = null;  // Element locked by click
  private panelLocked: boolean = false;  // Whether panel is locked (click-selected)

  constructor() {
    // Default settings (will be overwritten by message from content script)
    this.settings = {
      editor: 'cursor',
      customEditorUrl: '',
      hotkey: { altKey: true, ctrlKey: false, metaKey: false, shiftKey: false },
      projectPathPrefix: '',
      enabled: true,
      showTooltip: true,
      disableAutoOpen: false,
    };

    // Initialize adapters in priority order
    this.adapters = [
      new ReactAdapter(),
      new VueAdapter(),
      new SvelteAdapter(),
      new SolidAdapter(),
      new PreactAdapter(),
      new DataAttributeAdapter(),
    ].sort((a, b) => b.priority - a.priority);

    // Create overlay
    this.overlay = new Overlay();

    // Setup event listeners
    this.setupEventListeners();
    this.setupMessageListener();

    // Check for React DevTools
  }

  private setupEventListeners(): void {
    // Track hotkey state
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), true);

    // Track mouse movement for overlay
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);

    // Handle clicks
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Hide highlight when mouse leaves window (but not panel if locked)
    document.addEventListener('mouseleave', () => {
      if (!this.panelLocked) {
        this.overlay.hideHighlight();
      }
    });
  }

  private setupMessageListener(): void {
    // Listen for settings updates from content script
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      if (event.data?.type === 'SOURCESNAP_SETTINGS_UPDATE') {
        this.settings = { ...this.settings, ...event.data.payload };
        // Update overlay with editor settings
        this.overlay.setEditor(this.settings.editor, this.settings.projectPathPrefix);
      }
    });

    // Request initial settings
    window.postMessage({ type: 'SOURCESNAP_GET_SETTINGS' }, '*');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.settings.enabled) return;

    // Don't change state if panel is locked
    if (this.panelLocked) return;

    if (this.isHotkeyPressed(event)) {
      this.hotkeyPressed = true;
      document.body.style.cursor = 'crosshair';

      // Show highlight for current element if any (not full panel)
      if (this.currentElement) {
        this.showHighlightForElement(this.currentElement);
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Check if all modifier keys are released
    const hotkey = this.settings.hotkey;
    if (
      (hotkey.altKey && !event.altKey) ||
      (hotkey.ctrlKey && !event.ctrlKey) ||
      (hotkey.metaKey && !event.metaKey) ||
      (hotkey.shiftKey && !event.shiftKey)
    ) {
      this.hotkeyPressed = false;
      document.body.style.cursor = '';
      // Only hide highlight if panel is not locked
      if (!this.panelLocked) {
        this.overlay.hideHighlight();
      }
    }

    // Escape key unlocks panel
    if (event.key === 'Escape' && this.panelLocked) {
      this.unlockPanel();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.settings.enabled) return;

    // Don't track mouse if panel is locked (except when over the panel itself)
    if (this.panelLocked) {
      return;
    }

    this.currentElement = event.target as HTMLElement;

    // Only show highlight on hover when hotkey is pressed (not the full panel)
    if (this.hotkeyPressed && this.settings.showTooltip) {
      this.showHighlightForElement(this.currentElement);
    }
  }

  private handleClick(event: MouseEvent): void {
    // If panel is locked, check if click is outside the panel to unlock
    if (this.panelLocked) {
      // Check if click is outside the panel (handled by overlay)
      if (!this.overlay.isClickInsidePanel(event)) {
        this.unlockPanel();
      }
      return;
    }

    if (!this.settings.enabled) {
      return;
    }
    if (!this.isHotkeyPressed(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const element = event.target as HTMLElement;

    const info = this.getElementInfo(element);

    if (info) {
      // Lock the panel and show full overlay with info
      this.panelLocked = true;
      this.lockedElement = element;
      this.overlay.show(info);

      // Auto-open in IDE unless disabled
      if (!this.settings.disableAutoOpen && info.source) {
        this.openInEditor(info.source);
      }
    } else {
      // No source info found
    }
  }

  private unlockPanel(): void {
    this.panelLocked = false;
    this.lockedElement = null;
    this.overlay.hide();
  }

  private showHighlightForElement(element: HTMLElement): void {
    const info = this.getElementInfo(element);
    if (info) {
      // Only show highlight, not full panel
      this.overlay.showHighlightOnly(info);
    } else {
      this.overlay.hideHighlight();
    }
  }

  private getSourceInfo(element: HTMLElement): SourceInfo | null {
    for (const adapter of this.adapters) {
      if (adapter.isApplicable()) {
        const info = adapter.getSourceInfo(element);
        if (info) {
          return info;
        }
      }
    }
    return null;
  }

  private getElementInfo(element: HTMLElement) {
    for (const adapter of this.adapters) {
      if (adapter.isApplicable()) {
        const info = adapter.getElementInfo(element);
        if (info) return info;
      }
    }
    return null;
  }

  private isHotkeyPressed(event: MouseEvent | KeyboardEvent): boolean {
    const hotkey = this.settings.hotkey;
    // For keyboard events, check if the required modifier keys are pressed
    // For mouse events, check exact match
    if (hotkey.altKey && !event.altKey) return false;
    if (hotkey.ctrlKey && !event.ctrlKey) return false;
    if (hotkey.metaKey && !event.metaKey) return false;
    if (hotkey.shiftKey && !event.shiftKey) return false;
    // At least one modifier must be required and pressed
    return hotkey.altKey || hotkey.ctrlKey || hotkey.metaKey || hotkey.shiftKey;
  }

  private openInEditor(source: SourceInfo): void {
    try {
      const url = buildEditorUrl(
        this.settings.editor,
        source,
        this.settings.projectPathPrefix,
        this.settings.customEditorUrl
      );
      // Use location.href for URL schemes (more reliable than window.open)
      window.location.href = url;
    } catch (error) {
      // Failed to open editor
    }
  }
}

// Initialize SourceSnap when the script loads
new SourceSnap();
