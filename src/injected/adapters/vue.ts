import type { SourceInfo, ElementInfo } from '../../shared/types';
import type { FrameworkAdapter } from './interface';
import { createElementInfo, extractComponentName } from './interface';

// Vue component types (simplified)
interface VueComponent {
  type?: {
    __file?: string;
    __name?: string;
    name?: string;
  };
  $options?: {
    __file?: string;
    name?: string;
  };
}

interface VueElement extends HTMLElement {
  __vueParentComponent?: VueComponent;
  __vue__?: VueComponent; // Vue 2
}

declare global {
  interface Window {
    __VUE__?: any;
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

export class VueAdapter implements FrameworkAdapter {
  id = 'vue';
  name = 'Vue';
  priority = 90;

  isApplicable(): boolean {
    return !!(window.__VUE__ || window.__VUE_DEVTOOLS_GLOBAL_HOOK__);
  }

  getSourceInfo(element: HTMLElement): SourceInfo | null {
    const vueElement = element as VueElement;

    // Vue 3: Check __vueParentComponent
    if (vueElement.__vueParentComponent?.type?.__file) {
      const component = vueElement.__vueParentComponent;
      return {
        fileName: component.type!.__file!,
        lineNumber: 1, // Vue doesn't provide line numbers in component __file
        columnNumber: 1,
        componentName: component.type!.__name || component.type!.name,
      };
    }

    // Check for data-v-inspector attribute (from vue-inspector plugin)
    const inspectorData = element.getAttribute('data-v-inspector');
    if (inspectorData) {
      const match = inspectorData.match(/(.+):(\d+):(\d+)$/);
      if (match) {
        return {
          fileName: match[1],
          lineNumber: parseInt(match[2], 10),
          columnNumber: parseInt(match[3], 10),
          componentName: extractComponentName(match[1]),
        };
      }
    }

    // Vue 2: Check __vue__ property
    if (vueElement.__vue__?.$options?.__file) {
      const vue2 = vueElement.__vue__;
      return {
        fileName: vue2.$options!.__file!,
        lineNumber: 1,
        columnNumber: 1,
        componentName: vue2.$options!.name,
      };
    }

    // Walk up DOM tree to find Vue component
    let current: HTMLElement | null = element;
    while (current) {
      const vCurrent = current as VueElement;
      if (vCurrent.__vueParentComponent?.type?.__file) {
        return {
          fileName: vCurrent.__vueParentComponent.type.__file,
          lineNumber: 1,
          columnNumber: 1,
          componentName: vCurrent.__vueParentComponent.type.__name ||
                        vCurrent.__vueParentComponent.type.name,
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
