# SourceSnap

**Snap to source code instantly.** Alt+Click any element in the browser to open its source file in your editor.

## Features

- **Multi-Framework Support**: React, Vue, Svelte, SolidJS, Preact
- **Multi-Editor Support**: VS Code, Cursor, WebStorm, Sublime, Vim, and 10+ more
- **Zero Configuration**: Works out of the box - no bundler plugins needed
- **Lightweight**: Pure browser extension, no build-time dependencies

## How It Works

1. Install the extension
2. Select your preferred editor in the popup
3. Hold `Alt` and click any element on the page
4. The source file opens in your editor at the correct line

## Supported Frameworks

| Framework | Detection Method |
|-----------|-----------------|
| React | DevTools hook, Fiber internals |
| Vue 2/3 | Vue DevTools hook, component `__file` |
| Svelte | `__svelte_meta` attribute |
| SolidJS | Data attributes from babel plugin |
| Preact | Preact DevTools, component internals |

Also works with apps using these data attributes:
- `data-insp-path` (code-inspector)
- `data-locatorjs` (locatorjs)
- `data-v-inspector` (vue-inspector)

## Supported Editors

- VS Code / VS Code Insiders
- Cursor
- Windsurf
- Zed
- WebStorm / PhpStorm / IntelliJ IDEA / PyCharm / GoLand / RubyMine / Rider
- Sublime Text
- Atom
- MacVim
- Emacs
- Custom URL scheme

## Development

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Watch mode
npm run dev
```

### Load in Chrome

1. Build the extension: `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Project Structure

```
sourcesnap/
├── src/
│   ├── background/        # Service worker
│   ├── content/           # Content script (injects page script)
│   ├── injected/          # Page-context script
│   │   └── adapters/      # Framework adapters
│   ├── overlay/           # Shadow DOM overlay UI
│   ├── popup/             # Extension popup UI
│   └── shared/            # Shared types and utilities
├── manifest.json          # Chrome Extension Manifest V3
└── vite.config.ts         # Build configuration
```

## License

MIT
