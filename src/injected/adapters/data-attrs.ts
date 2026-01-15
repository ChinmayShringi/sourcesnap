import type { SourceInfo, ElementInfo } from '../../shared/types';
import type { FrameworkAdapter } from './interface';
import { createElementInfo, extractComponentName } from './interface';

// Data attribute patterns from various click-to-code tools
const DATA_ATTRIBUTES = [
  'data-insp-path',      // code-inspector: "path:line:column:tagName"
  'data-locatorjs',      // locatorjs: "path:line:column"
  'data-locatorjs-id',   // locatorjs: "projectPath/filePath::id"
  'data-v-inspector',    // vue-inspector: "path:line:column"
  'data-source-file',    // generic
  'data-react-inspector', // vite-plugin-react-inspector
];

export class DataAttributeAdapter implements FrameworkAdapter {
  id = 'data-attr';
  name = 'Data Attributes';
  priority = 0; // Lowest priority - fallback

  isApplicable(): boolean {
    // Always applicable as fallback
    return true;
  }

  getSourceInfo(element: HTMLElement): SourceInfo | null {
    // Try each data attribute pattern
    for (const attr of DATA_ATTRIBUTES) {
      const value = element.getAttribute(attr);
      if (value) {
        const source = this.parseAttribute(attr, value);
        if (source) return source;
      }
    }

    // Walk up DOM tree
    let current: HTMLElement | null = element.parentElement;
    while (current) {
      for (const attr of DATA_ATTRIBUTES) {
        const value = current.getAttribute(attr);
        if (value) {
          const source = this.parseAttribute(attr, value);
          if (source) return source;
        }
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

  private parseAttribute(attr: string, value: string): SourceInfo | null {
    switch (attr) {
      case 'data-insp-path': {
        // Format: "path:line:column:tagName"
        const parts = value.split(':');
        if (parts.length >= 3) {
          const tagName = parts.pop(); // Remove tagName
          const column = parseInt(parts.pop() || '1', 10);
          const line = parseInt(parts.pop() || '1', 10);
          const file = parts.join(':'); // Handle Windows paths with ":"
          return {
            fileName: file,
            lineNumber: line,
            columnNumber: column,
            componentName: extractComponentName(file),
          };
        }
        break;
      }

      case 'data-locatorjs':
      case 'data-v-inspector':
      case 'data-react-inspector': {
        // Format: "path:line:column"
        const match = value.match(/(.+):(\d+):(\d+)$/);
        if (match) {
          return {
            fileName: match[1],
            lineNumber: parseInt(match[2], 10),
            columnNumber: parseInt(match[3], 10),
            componentName: extractComponentName(match[1]),
          };
        }
        break;
      }

      case 'data-locatorjs-id': {
        // Format: "projectPath/filePath::id"
        if (value.includes('::')) {
          const filePath = value.split('::')[0];
          return {
            fileName: filePath,
            lineNumber: 1,
            columnNumber: 1,
            componentName: extractComponentName(filePath),
          };
        }
        break;
      }

      case 'data-source-file': {
        // Simple format: just the file path
        const line = parseInt(
          element.getAttribute('data-source-line') || '1',
          10
        );
        const column = parseInt(
          element.getAttribute('data-source-column') || '1',
          10
        );
        return {
          fileName: value,
          lineNumber: line,
          columnNumber: column,
          componentName: extractComponentName(value),
        };
      }
    }

    return null;
  }
}
