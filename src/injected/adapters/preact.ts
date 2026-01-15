import type { SourceInfo, ElementInfo } from '../../shared/types';
import type { FrameworkAdapter } from './interface';
import { createElementInfo } from './interface';

// Preact internal types (simplified)
interface PreactComponent {
  __c?: {
    constructor?: {
      name?: string;
      displayName?: string;
    };
    __source?: {
      fileName: string;
      lineNumber: number;
      columnNumber?: number;
    };
  };
  __v?: {
    type?: any;
    __source?: {
      fileName: string;
      lineNumber: number;
      columnNumber?: number;
    };
  };
}

interface PreactElement extends HTMLElement {
  __preactattr_?: any;
  _component?: PreactComponent;
}

declare global {
  interface Window {
    __PREACT_DEVTOOLS__?: any;
  }
}

export class PreactAdapter implements FrameworkAdapter {
  id = 'preact';
  name = 'Preact';
  priority = 60;

  isApplicable(): boolean {
    // Check for Preact DevTools
    if (window.__PREACT_DEVTOOLS__) return true;

    // Check for Preact internal properties on elements
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const preactEl = el as PreactElement;
      if (preactEl.__preactattr_ || preactEl._component) {
        return true;
      }
    }

    return false;
  }

  getSourceInfo(element: HTMLElement): SourceInfo | null {
    const preactElement = element as PreactElement;

    // Check for component with source info
    if (preactElement._component?.__c?.__source) {
      const source = preactElement._component.__c.__source;
      return {
        fileName: source.fileName,
        lineNumber: source.lineNumber,
        columnNumber: source.columnNumber,
        componentName: this.getComponentName(preactElement._component),
      };
    }

    // Check vnode source
    if (preactElement._component?.__v?.__source) {
      const source = preactElement._component.__v.__source;
      return {
        fileName: source.fileName,
        lineNumber: source.lineNumber,
        columnNumber: source.columnNumber,
        componentName: this.getVNodeName(preactElement._component.__v),
      };
    }

    // Walk up DOM tree
    let current: HTMLElement | null = element;
    while (current) {
      const pEl = current as PreactElement;
      if (pEl._component?.__c?.__source) {
        const source = pEl._component.__c.__source;
        return {
          fileName: source.fileName,
          lineNumber: source.lineNumber,
          columnNumber: source.columnNumber,
          componentName: this.getComponentName(pEl._component),
        };
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

  private getComponentName(component: PreactComponent): string {
    if (component.__c?.constructor?.displayName) {
      return component.__c.constructor.displayName;
    }
    if (component.__c?.constructor?.name) {
      return component.__c.constructor.name;
    }
    return 'Unknown';
  }

  private getVNodeName(vnode: any): string {
    if (!vnode?.type) return 'Unknown';
    if (typeof vnode.type === 'string') return vnode.type;
    return vnode.type.displayName || vnode.type.name || 'Anonymous';
  }
}
