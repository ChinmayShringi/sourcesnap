import type { SourceInfo, ElementInfo } from '../../shared/types';

// Base interface for all framework adapters
export interface FrameworkAdapter {
  // Unique identifier
  id: string;

  // Display name for UI
  name: string;

  // Priority (higher = checked first)
  priority: number;

  // Check if this framework is present on the page
  isApplicable(): boolean;

  // Get source location for a DOM element
  getSourceInfo(element: HTMLElement): SourceInfo | null;

  // Get full element info including bounding box
  getElementInfo(element: HTMLElement): ElementInfo | null;
}

// Helper to extract component name from file path
export function extractComponentName(filePath: string): string {
  const match = filePath.match(/([^/\\]+)\.(tsx?|jsx?|vue|svelte)$/);
  return match?.[1] || 'Unknown';
}

// Helper to create ElementInfo from SourceInfo
export function createElementInfo(
  element: HTMLElement,
  source: SourceInfo
): ElementInfo {
  return {
    source,
    componentName: source.componentName || extractComponentName(source.fileName),
    tagName: element.tagName.toLowerCase(),
    boundingBox: element.getBoundingClientRect(),
  };
}
