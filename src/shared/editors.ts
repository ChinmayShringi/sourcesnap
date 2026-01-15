// Editor configurations with URL schemes
export interface EditorConfig {
  id: string;
  name: string;
  urlTemplate: string;
}

export const EDITORS: Record<string, EditorConfig> = {
  vscode: {
    id: 'vscode',
    name: 'VS Code',
    urlTemplate: 'vscode://file/{filePath}:{line}:{column}',
  },
  'vscode-insiders': {
    id: 'vscode-insiders',
    name: 'VS Code Insiders',
    urlTemplate: 'vscode-insiders://file/{filePath}:{line}:{column}',
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    urlTemplate: 'cursor://file/{filePath}:{line}:{column}',
  },
  windsurf: {
    id: 'windsurf',
    name: 'Windsurf',
    urlTemplate: 'windsurf://file/{filePath}:{line}:{column}',
  },
  zed: {
    id: 'zed',
    name: 'Zed',
    urlTemplate: 'zed://file/{filePath}:{line}:{column}',
  },
  webstorm: {
    id: 'webstorm',
    name: 'WebStorm',
    urlTemplate: 'webstorm://open?file={filePath}&line={line}&column={column}',
  },
  phpstorm: {
    id: 'phpstorm',
    name: 'PhpStorm',
    urlTemplate: 'phpstorm://open?file={filePath}&line={line}&column={column}',
  },
  idea: {
    id: 'idea',
    name: 'IntelliJ IDEA',
    urlTemplate: 'idea://open?file={filePath}&line={line}&column={column}',
  },
  pycharm: {
    id: 'pycharm',
    name: 'PyCharm',
    urlTemplate: 'pycharm://open?file={filePath}&line={line}&column={column}',
  },
  goland: {
    id: 'goland',
    name: 'GoLand',
    urlTemplate: 'goland://open?file={filePath}&line={line}&column={column}',
  },
  rubymine: {
    id: 'rubymine',
    name: 'RubyMine',
    urlTemplate: 'rubymine://open?file={filePath}&line={line}&column={column}',
  },
  rider: {
    id: 'rider',
    name: 'Rider',
    urlTemplate: 'rider://open?file={filePath}&line={line}&column={column}',
  },
  sublime: {
    id: 'sublime',
    name: 'Sublime Text',
    urlTemplate: 'subl://open?url=file://{filePath}&line={line}&column={column}',
  },
  atom: {
    id: 'atom',
    name: 'Atom',
    urlTemplate: 'atom://core/open/file?filename={filePath}&line={line}&column={column}',
  },
  vim: {
    id: 'vim',
    name: 'MacVim',
    urlTemplate: 'mvim://open?url=file://{filePath}&line={line}',
  },
  emacs: {
    id: 'emacs',
    name: 'Emacs',
    urlTemplate: 'emacs://open?url=file://{filePath}&line={line}',
  },
  'android-studio': {
    id: 'android-studio',
    name: 'Android Studio',
    urlTemplate: 'idea://open?file={filePath}&line={line}&column={column}',
  },
  clion: {
    id: 'clion',
    name: 'CLion',
    urlTemplate: 'clion://open?file={filePath}&line={line}&column={column}',
  },
  fleet: {
    id: 'fleet',
    name: 'Fleet',
    urlTemplate: 'fleet://open?file={filePath}&line={line}&column={column}',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    urlTemplate: 'nova://open?path={filePath}&line={line}',
  },
  textmate: {
    id: 'textmate',
    name: 'TextMate',
    urlTemplate: 'txmt://open?url=file://{filePath}&line={line}&column={column}',
  },
  brackets: {
    id: 'brackets',
    name: 'Brackets',
    urlTemplate: 'brackets://open?url=file://{filePath}&line={line}',
  },
  antigravity: {
    id: 'antigravity',
    name: 'Antigravity (Google)',
    urlTemplate: 'anthropic://open?file={filePath}&line={line}&column={column}',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    urlTemplate: '',
  },
};

// Build the editor URL from source info
export function buildEditorUrl(
  editorId: string,
  source: { fileName: string; lineNumber: number; columnNumber?: number },
  projectPathPrefix?: string,
  customUrl?: string
): string {
  const editor = EDITORS[editorId];
  if (!editor) {
    throw new Error(`Unknown editor: ${editorId}`);
  }

  const template = editorId === 'custom' && customUrl ? customUrl : editor.urlTemplate;
  if (!template) {
    throw new Error(`No URL template for editor: ${editorId}`);
  }

  // Build file path with optional prefix
  let filePath = source.fileName;
  if (projectPathPrefix && !filePath.startsWith('/')) {
    filePath = `${projectPathPrefix}/${filePath}`.replace(/\/+/g, '/');
  }

  // Ensure path starts with / for URL schemes
  if (!filePath.startsWith('/')) {
    filePath = `/${filePath}`;
  }

  return template
    .replace('{filePath}', filePath)
    .replace('{line}', String(source.lineNumber || 1))
    .replace('{column}', String(source.columnNumber || 1));
}

// Get sorted list of editors for UI
export function getEditorList(): EditorConfig[] {
  return Object.values(EDITORS).sort((a, b) => {
    // Put common editors first
    const priority = ['vscode', 'cursor', 'webstorm', 'sublime'];
    const aIndex = priority.indexOf(a.id);
    const bIndex = priority.indexOf(b.id);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}
