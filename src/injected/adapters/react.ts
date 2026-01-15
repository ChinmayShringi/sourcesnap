import type { SourceInfo, ElementInfo, ComponentNode } from '../../shared/types';
import type { FrameworkAdapter } from './interface';
import { extractComponentName } from './interface';

// React Fiber types (simplified)
interface Fiber {
  type: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  memoizedProps?: Record<string, any>;
  pendingProps?: Record<string, any>;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  };
  _debugOwner?: Fiber;
}

interface ReactDevToolsHook {
  renderers: Map<number, { findFiberByHostInstance: (element: HTMLElement) => Fiber | null }>;
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
  }
}

export class ReactAdapter implements FrameworkAdapter {
  id = 'react';
  name = 'React';
  priority = 100;

  isApplicable(): boolean {
    // Check for React DevTools hook (even without renderers - they may register later)
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook) return true;

    // Check for React fiber keys on any element in the DOM
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      for (const key in el) {
        if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
          return true;
        }
      }
      // Only check first 10 elements for performance
      if (Array.from(allElements).indexOf(el) > 10) break;
    }

    return false;
  }

  getSourceInfo(element: HTMLElement): SourceInfo | null {
    const fiber = this.findFiberByElement(element);
    if (!fiber) return null;

    // Walk up the fiber tree to find debug source
    const sourceInfo = this.findDebugSource(fiber);
    if (!sourceInfo) return null;

    return {
      fileName: sourceInfo._debugSource!.fileName,
      lineNumber: sourceInfo._debugSource!.lineNumber,
      columnNumber: sourceInfo._debugSource!.columnNumber,
      componentName: this.getFiberName(fiber),
    };
  }

  getElementInfo(element: HTMLElement): ElementInfo | null {
    const fiber = this.findFiberByElement(element);
    if (!fiber) return null;

    const sourceInfo = this.findDebugSource(fiber);
    if (!sourceInfo?._debugSource) return null;

    const source: SourceInfo = {
      fileName: sourceInfo._debugSource.fileName,
      lineNumber: sourceInfo._debugSource.lineNumber,
      columnNumber: sourceInfo._debugSource.columnNumber,
      componentName: this.getFiberName(sourceInfo),
    };

    // Get component hierarchy
    const hierarchy = this.getComponentHierarchy(fiber);

    // Get props from the fiber
    const props = this.getProps(fiber);

    // Extract current className and styles
    const className = element.className || '';
    const computedStyle = window.getComputedStyle(element);
    const inlineStyle = element.getAttribute('style') || '';

    // Parse inline styles into object
    const style: Record<string, string> = {};
    if (inlineStyle) {
      inlineStyle.split(';').forEach(rule => {
        const [prop, val] = rule.split(':').map(s => s.trim());
        if (prop && val) {
          style[prop] = val;
        }
      });
    }

    return {
      source,
      componentName: this.getFiberName(sourceInfo),
      tagName: element.tagName.toLowerCase(),
      boundingBox: element.getBoundingClientRect(),
      hierarchy,
      props,
      fiber,
      element,
      className: typeof className === 'string' ? className : '',
      style,
    };
  }

  private getComponentHierarchy(fiber: Fiber): ComponentNode[] {
    const hierarchy: ComponentNode[] = [];
    let current: Fiber | null = fiber;
    let depth = 0;
    const maxDepth = 20;

    while (current && depth < maxDepth) {
      // Only include actual components (not DOM elements)
      if (current.type && typeof current.type !== 'string') {
        const name = this.getFiberName(current);
        const source = current._debugSource ? {
          fileName: current._debugSource.fileName,
          lineNumber: current._debugSource.lineNumber,
          columnNumber: current._debugSource.columnNumber,
          componentName: name,
        } : null;

        hierarchy.push({
          name,
          source,
          props: this.getProps(current),
          isCurrentTarget: depth === 0,
        });
      }

      current = current.return;
      depth++;
    }

    return hierarchy;
  }

  private getProps(fiber: Fiber): Record<string, any> | undefined {
    const rawProps = fiber.memoizedProps || fiber.pendingProps;
    if (!rawProps) return undefined;

    // Filter and serialize props for display
    const props: Record<string, any> = {};

    for (const [key, value] of Object.entries(rawProps)) {
      // Skip children and internal props
      if (key === 'children' || key.startsWith('__')) continue;

      // Serialize value for display
      props[key] = this.serializeValue(value);
    }

    return Object.keys(props).length > 0 ? props : undefined;
  }

  private serializeValue(value: any, depth = 0): any {
    if (depth > 2) return '[...]';

    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    if (type === 'string') {
      return value.length > 50 ? value.slice(0, 50) + '...' : value;
    }
    if (type === 'number' || type === 'boolean') {
      return value;
    }
    if (type === 'function') {
      return `ƒ ${value.name || 'anonymous'}()`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length > 3) return `[${value.length} items]`;
      return value.map(v => this.serializeValue(v, depth + 1));
    }
    if (type === 'object') {
      // React element
      if (value.$$typeof) {
        return `<${value.type?.name || value.type || 'Element'} />`;
      }
      // Regular object
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      if (keys.length > 5) return `{${keys.length} keys}`;
      const obj: Record<string, any> = {};
      for (const k of keys.slice(0, 5)) {
        obj[k] = this.serializeValue(value[k], depth + 1);
      }
      return obj;
    }

    return String(value);
  }

  private findFiberByElement(element: HTMLElement): Fiber | null {
    // Method 1: Direct fiber property access (most reliable for modern React)
    for (const key in element) {
      if (key.startsWith('__reactFiber$')) {
        return (element as any)[key] as Fiber;
      }
      if (key.startsWith('__reactInternalInstance$')) {
        return (element as any)[key] as Fiber;
      }
    }

    // Method 2: Use React DevTools hook
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook?.renderers) {
      for (const renderer of hook.renderers.values()) {
        try {
          const fiber = renderer.findFiberByHostInstance?.(element);
          if (fiber) return fiber;
        } catch {
          // Ignore errors from renderer
        }
      }
    }

    // Method 3: Walk up DOM tree to find React root
    let current: HTMLElement | null = element;
    while (current) {
      for (const key in current) {
        if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
          return (current as any)[key] as Fiber;
        }
      }
      current = current.parentElement;
    }

    return null;
  }

  private findDebugSource(fiber: Fiber): Fiber | null {
    let current: Fiber | null = fiber;
    let depth = 0;

    // Walk up the fiber tree to find the first component with debug source
    while (current && depth < 50) {
      if (current._debugSource) {
        return current;
      }
      // Try debug owner first (for function components)
      if (current._debugOwner?._debugSource) {
        return current._debugOwner;
      }
      current = current.return;
      depth++;
    }

    return null;
  }

  private getFiberName(fiber: Fiber): string {
    const type = fiber.type;
    if (!type) return 'Unknown';
    if (typeof type === 'string') return type; // DOM element
    return type.displayName || type.name || 'Anonymous';
  }
}
