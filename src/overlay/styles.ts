// Styles for the Shadow DOM overlay - Rich panel UI
export const OVERLAY_STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .highlight {
    position: fixed;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    transition: all 0.05s ease-out;
    border-radius: 2px;
  }

  .tooltip {
    position: fixed;
    background: #1a1a1a;
    color: #e5e5e5;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1);
    pointer-events: none;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 300px;
  }

  .tooltip-component {
    color: #61dafb;
    font-weight: 600;
    font-size: 13px;
  }

  .tooltip-file {
    color: #98c379;
    font-family: 'SF Mono', Monaco, 'Consolas', monospace;
    font-size: 11px;
  }

  .tooltip-hint {
    color: #6b7280;
    font-size: 10px;
    margin-top: 2px;
  }

  .panel {
    position: fixed;
    background: #1a1a1a;
    color: #e5e5e5;
    border-radius: 12px;
    font-size: 12px;
    width: 380px;
    max-height: 500px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1);
    pointer-events: auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    padding: 12px 14px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .panel-icon {
    width: 20px;
    height: 20px;
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .panel-icon svg {
    width: 14px;
    height: 14px;
    fill: white;
  }

  .panel-title {
    font-weight: 600;
    font-size: 13px;
    color: white;
    flex: 1;
  }

  .panel-tag {
    font-size: 10px;
    background: rgba(255,255,255,0.2);
    padding: 2px 6px;
    border-radius: 4px;
    color: rgba(255,255,255,0.9);
  }

  .panel-body {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .section {
    border-bottom: 1px solid #2a2a2a;
  }

  .section:last-child {
    border-bottom: none;
  }

  .section-header {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    background: #222;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .section-icon {
    opacity: 0.6;
  }

  /* File Section */
  .file-info {
    padding: 12px 14px;
  }

  .file-path {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
    font-size: 11px;
    color: #98c379;
    word-break: break-all;
    line-height: 1.5;
  }

  .file-location {
    margin-top: 6px;
    font-size: 11px;
    color: #6b7280;
  }

  .file-location span {
    color: #e5c07b;
  }

  /* Props Section */
  .props-list {
    padding: 8px 14px;
  }

  .prop-item {
    display: flex;
    padding: 4px 0;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
    font-size: 11px;
    line-height: 1.4;
  }

  .prop-name {
    color: #c678dd;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .prop-equals {
    color: #6b7280;
    margin-right: 4px;
  }

  .prop-value {
    color: #98c379;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .prop-value.string { color: #98c379; }
  .prop-value.number { color: #e5c07b; }
  .prop-value.boolean { color: #56b6c2; }
  .prop-value.function { color: #61afef; }
  .prop-value.object { color: #e06c75; }

  /* Component Tree Section */
  .tree {
    padding: 8px 14px;
  }

  .tree-item {
    display: flex;
    align-items: flex-start;
    padding: 4px 0;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 -6px;
    padding-left: 6px;
    padding-right: 6px;
  }

  .tree-item:hover {
    background: rgba(59, 130, 246, 0.15);
  }

  .tree-item.current {
    background: rgba(59, 130, 246, 0.2);
  }

  .tree-indent {
    width: 12px;
    flex-shrink: 0;
    color: #4b5563;
    font-size: 10px;
    padding-top: 2px;
  }

  .tree-content {
    flex: 1;
    min-width: 0;
  }

  .tree-name {
    color: #61dafb;
    font-weight: 500;
    font-size: 12px;
  }

  .tree-file {
    font-size: 10px;
    color: #6b7280;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-file span {
    color: #4ade80;
  }

  .tree-no-source {
    font-style: italic;
    color: #4b5563;
  }

  /* Footer */
  .panel-footer {
    padding: 10px 14px;
    background: #222;
    border-top: 1px solid #2a2a2a;
    font-size: 10px;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .footer-hint {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .kbd {
    background: #333;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 9px;
    border: 1px solid #444;
  }

  .hidden {
    display: none !important;
  }

  /* Scrollbar styling */
  .panel-body::-webkit-scrollbar {
    width: 6px;
  }

  .panel-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .panel-body::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 3px;
  }

  .panel-body::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* No props message */
  .no-props {
    padding: 8px 14px;
    color: #6b7280;
    font-style: italic;
    font-size: 11px;
  }

  /* Action buttons */
  .actions {
    display: flex;
    gap: 6px;
    padding: 8px 14px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: #2d2d2d;
    border: 1px solid #404040;
    border-radius: 6px;
    color: #e5e5e5;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  .action-btn svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }

  .action-btn.copied {
    background: #22c55e;
    border-color: #22c55e;
  }

  .action-btn.open-ide-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #3b82f6;
    color: white;
    font-weight: 600;
  }

  .action-btn.open-ide-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  /* Box model visualization */
  .box-model {
    position: fixed;
    pointer-events: none;
  }

  .box-margin {
    position: absolute;
    background: rgba(255, 155, 0, 0.15);
    border: 1px dashed rgba(255, 155, 0, 0.5);
  }

  .box-border {
    position: absolute;
    background: rgba(255, 200, 50, 0.2);
  }

  .box-padding {
    position: absolute;
    background: rgba(100, 200, 100, 0.2);
  }

  .box-content {
    position: absolute;
    background: rgba(100, 150, 255, 0.2);
    border: 2px solid #3b82f6;
  }

  /* Dimension labels */
  .dimension-label {
    position: absolute;
    background: #1a1a1a;
    color: #e5c07b;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: monospace;
    white-space: nowrap;
  }

  /* Live Edit Section */
  .edit-section {
    padding: 12px 14px;
  }

  .edit-field {
    margin-bottom: 12px;
  }

  .edit-field:last-child {
    margin-bottom: 0;
  }

  .edit-label {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .edit-input {
    width: 100%;
    padding: 8px 10px;
    font-size: 11px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
    background: #2d2d2d;
    border: 1px solid #404040;
    border-radius: 6px;
    color: #e5e5e5;
    outline: none;
    resize: vertical;
    min-height: 32px;
  }

  .edit-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .edit-input.modified {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  textarea.edit-input {
    min-height: 60px;
    line-height: 1.4;
  }

  /* Style Editor - Chrome DevTools style */
  .style-editor {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
    font-size: 11px;
  }

  .style-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 0;
    border-bottom: 1px solid #2a2a2a;
  }

  .style-row:last-child {
    border-bottom: none;
  }

  .style-row:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .style-checkbox {
    width: 14px;
    height: 14px;
    accent-color: #3b82f6;
    cursor: pointer;
    flex-shrink: 0;
  }

  .style-property {
    color: #c678dd;
    background: transparent;
    border: none;
    outline: none;
    padding: 2px 4px;
    width: 120px;
    font-family: inherit;
    font-size: inherit;
  }

  .style-property:focus {
    background: #2d2d2d;
    border-radius: 2px;
  }

  .style-colon {
    color: #6b7280;
    flex-shrink: 0;
  }

  .style-value {
    color: #98c379;
    background: transparent;
    border: none;
    outline: none;
    padding: 2px 4px;
    flex: 1;
    min-width: 60px;
    font-family: inherit;
    font-size: inherit;
  }

  .style-value:focus {
    background: #2d2d2d;
    border-radius: 2px;
  }

  .style-value.color-value {
    color: #e5c07b;
  }

  .style-value.number-value {
    color: #d19a66;
  }

  .style-delete {
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .style-row:hover .style-delete {
    opacity: 1;
  }

  .style-delete:hover {
    color: #ef4444;
  }

  .style-add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    margin-top: 6px;
    background: transparent;
    border: 1px dashed #404040;
    border-radius: 4px;
    color: #6b7280;
    font-size: 11px;
    cursor: pointer;
    width: 100%;
    justify-content: center;
  }

  .style-add-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  /* Autocomplete dropdown */
  .style-property::-webkit-calendar-picker-indicator,
  .style-value::-webkit-calendar-picker-indicator {
    display: none;
  }

  datalist {
    background: #1a1a1a;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .save-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .save-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .save-btn svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  .reset-btn {
    padding: 10px 16px;
    background: #2d2d2d;
    border: 1px solid #404040;
    border-radius: 8px;
    color: #e5e5e5;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .reset-btn:hover {
    background: #404040;
  }

  .status-message {
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 11px;
    text-align: center;
  }

  .status-message.success {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .status-message.error {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .status-message.info {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  /* Server status indicator */
  .server-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
  }

  .server-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
  }

  .server-dot.connected {
    background: #22c55e;
  }
`;


