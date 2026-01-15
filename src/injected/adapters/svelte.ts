import type { SourceInfo, ElementInfo } from '../../shared/types';
import type { FrameworkAdapter } from './interface';
import { createElementInfo, extractComponentName } from './interface';

// Svelte metadata types
interface SvelteMeta {
  loc: {
    file: string;
    line: number;
    column: number;
    char: number;
  };
}

interface SvelteElement extends HTMLElement {
  __svelte_meta?: SvelteMeta;
}

declare global {
  interface Window {
    __SVELTE_HMR?: any;
    __SAPPER__?: any;
  }
}

export class SvelteAdapter implements FrameworkAdapter {
  id = 'svelte';
  name = 'Svelte';
  priority = 80;

  isApplicable(): boolean {
    // Check for Svelte HMR or Sapper
    if (window.__SVELTE_HMR || window.__SAPPER__) return true;

    // Check for any element with __svelte_meta
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      if ((el as SvelteElement).__svelte_meta) {
        return true;
      }
    }

    return false;
  }

  getSourceInfo(element: HTMLElement): SourceInfo | null {
    // Check element itself
    const svelteElement = element as SvelteElement;
    if (svelteElement.__svelte_meta?.loc) {
      const { file, line, column } = svelteElement.__svelte_meta.loc;
      return {
        fileName: file,
        lineNumber: line + 1, // Svelte uses 0-based line numbers
        columnNumber: column + 1,
        componentName: extractComponentName(file),
      };
    }

    // Walk up the DOM tree to find Svelte metadata
    let current: HTMLElement | null = element;
    while (current) {
      const meta = (current as SvelteElement).__svelte_meta;
      if (meta?.loc) {
        return {
          fileName: meta.loc.file,
          lineNumber: meta.loc.line + 1,
          columnNumber: meta.loc.column + 1,
          componentName: extractComponentName(meta.loc.file),
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
}
