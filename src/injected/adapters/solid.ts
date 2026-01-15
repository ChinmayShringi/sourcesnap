import type { SourceInfo, ElementInfo } from '../../shared/types';
import type { FrameworkAdapter } from './interface';
import { createElementInfo, extractComponentName } from './interface';

declare global {
  interface Window {
    _$HY?: any; // Solid hydration marker
    Solid?: any;
  }
}

export class SolidAdapter implements FrameworkAdapter {
  id = 'solid';
  name = 'SolidJS';
  priority = 70;

  isApplicable(): boolean {
    // Check for Solid hydration marker
    if (window._$HY) return true;
    if (window.Solid) return true;

    // Check for data-hk attribute (Solid hydration key)
    return document.querySelector('[data-hk]') !== null;
  }

  getSourceInfo(element: HTMLElement): SourceInfo | null {
    // SolidJS with @locator/babel-jsx adds data-locatorjs attributes
    // Check for locatorjs data attribute
    const locatorData = element.dataset.locatorjsId || element.getAttribute('data-locatorjs');
    if (locatorData) {
      return this.parseLocatorData(locatorData);
    }

    // Walk up DOM tree
    let current: HTMLElement | null = element;
    while (current) {
      const data = current.dataset.locatorjsId || current.getAttribute('data-locatorjs');
      if (data) {
        return this.parseLocatorData(data);
      }
      current = current.parentElement;
    }

    return null;
  }

  getElementInfo(element: HTMLElement): ElementInfo | null {
    const source = this.getSourceInfo(element);
    if (!source) return null;
    return createElementInfo(element, source);
  }

  private parseLocatorData(data: string): SourceInfo | null {
    // Format: "projectPath/filePath::id" or "filePath:line:column"
    if (data.includes('::')) {
      // ID-based format - would need window.__LOCATOR_DATA__ lookup
      // For now, just extract file path
      const filePath = data.split('::')[0];
      return {
        fileName: filePath,
        lineNumber: 1,
        columnNumber: 1,
        componentName: extractComponentName(filePath),
      };
    }

    // Path-based format: "filePath:line:column"
    const match = data.match(/(.+):(\d+):(\d+)$/);
    if (match) {
      return {
        fileName: match[1],
        lineNumber: parseInt(match[2], 10),
        columnNumber: parseInt(match[3], 10),
        componentName: extractComponentName(match[1]),
      };
    }

    return null;
  }
}
