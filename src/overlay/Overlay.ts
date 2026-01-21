import type { ElementInfo, ComponentNode, SourceInfo } from '../shared/types';
import { OVERLAY_STYLES } from './styles';
import { buildEditorUrl } from '../shared/editors';
import { CSS_PROPERTIES } from './css_value';

// Common values for specific properties
const CSS_VALUES: Record<string, string[]> = {
  'display': ['none', 'block', 'inline', 'inline-block', 'flex', 'grid', 'inline-flex'],
  'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  'flex-direction': ['row', 'column', 'row-reverse', 'column-reverse'],
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-items': ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  'text-align': ['left', 'center', 'right', 'justify'],
  'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  'overflow': ['visible', 'hidden', 'scroll', 'auto'],
  'cursor': ['default', 'pointer', 'move', 'text', 'wait', 'not-allowed'],
  'visibility': ['visible', 'hidden'],
  'border-style': ['none', 'solid', 'dashed', 'dotted', 'double'],
};

export class Overlay {
  private shadowRoot: ShadowRoot;
  private container: HTMLElement;
  private highlight: HTMLElement;
  private tooltip: HTMLElement;
  private panel: HTMLElement;
  private isVisible: boolean = false;
  private currentInfo: ElementInfo | null = null;
  private editor: string = 'cursor';
  private projectPathPrefix: string = '';
  private originalClassName: string = '';
  private originalStyle: string = '';
  private originalOuterHTML: string = '';
  private styleRules: Array<{ property: string; value: string; enabled: boolean }> = [];

  constructor() {
    // Create container with Shadow DOM
    this.container = document.createElement('div');
    this.container.id = 'sourcesnap-overlay';
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = OVERLAY_STYLES;
    this.shadowRoot.appendChild(style);

    // Create highlight element
    this.highlight = document.createElement('div');
    this.highlight.className = 'highlight hidden';
    this.shadowRoot.appendChild(this.highlight);

    // Create tooltip element (for hover preview)
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip hidden';
    this.shadowRoot.appendChild(this.tooltip);

    // Create panel element
    this.panel = document.createElement('div');
    this.panel.className = 'panel hidden';
    this.shadowRoot.appendChild(this.panel);

    // Append to document
    document.body.appendChild(this.container);
  }

  setEditor(editor: string, projectPathPrefix: string = '') {
    this.editor = editor;
    this.projectPathPrefix = projectPathPrefix;
  }

  show(info: ElementInfo): void {
    this.isVisible = true;
    this.currentInfo = info;
    const rect = info.boundingBox;

    // Store original values for reset
    this.originalClassName = info.className || '';
    this.originalStyle = info.element?.getAttribute('style') || '';
    this.originalOuterHTML = info.element?.outerHTML || '';

    // Parse inline styles into rules
    this.styleRules = this.parseStyleString(this.originalStyle);

    // Hide tooltip (full panel replaces it)
    this.tooltip.classList.add('hidden');

    // Position and show highlight
    this.highlight.classList.remove('hidden');
    this.highlight.style.top = `${rect.top}px`;
    this.highlight.style.left = `${rect.left}px`;
    this.highlight.style.width = `${rect.width}px`;
    this.highlight.style.height = `${rect.height}px`;

    // Build panel HTML
    this.panel.innerHTML = this.buildPanelHTML(info);
    this.panel.classList.remove('hidden');

    // Attach event listeners
    this.attachEventListeners();

    // Position panel
    this.positionPanel(rect);
  }

  hide(): void {
    this.isVisible = false;
    this.currentInfo = null;
    this.highlight.classList.add('hidden');
    this.tooltip.classList.add('hidden');
    this.panel.classList.add('hidden');
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  // Show only highlight box + tooltip (for hover preview)
  showHighlightOnly(info: ElementInfo): void {
    const rect = info.boundingBox;

    // Position and show highlight
    this.highlight.classList.remove('hidden');
    this.highlight.style.top = `${rect.top}px`;
    this.highlight.style.left = `${rect.left}px`;
    this.highlight.style.width = `${rect.width}px`;
    this.highlight.style.height = `${rect.height}px`;

    // Show tooltip with component name and file
    const shortFile = this.getShortFileName(info.source.fileName);
    this.tooltip.innerHTML = `
      <span class="tooltip-component">&lt;${this.escapeHtml(info.componentName)}&gt;</span>
      <span class="tooltip-file">${this.escapeHtml(shortFile)}:${info.source.lineNumber}</span>
      <span class="tooltip-hint">Click to inspect</span>
    `;
    this.tooltip.classList.remove('hidden');

    // Position tooltip below the highlight
    const tooltipTop = rect.bottom + 8;
    const tooltipLeft = rect.left;
    this.tooltip.style.top = `${tooltipTop}px`;
    this.tooltip.style.left = `${tooltipLeft}px`;

    // Keep tooltip on screen
    if (tooltipTop + 60 > window.innerHeight) {
      this.tooltip.style.top = `${rect.top - 60}px`;
    }
  }

  // Hide highlight and tooltip (keep panel if locked)
  hideHighlight(): void {
    this.highlight.classList.add('hidden');
    this.tooltip.classList.add('hidden');
  }

  // Check if a click event is inside the panel
  isClickInsidePanel(event: MouseEvent): boolean {
    // Get the click coordinates
    const x = event.clientX;
    const y = event.clientY;

    // Check if panel is visible
    if (this.panel.classList.contains('hidden')) {
      return false;
    }

    // Get panel bounds
    const panelRect = this.panel.getBoundingClientRect();

    return (
      x >= panelRect.left &&
      x <= panelRect.right &&
      y >= panelRect.top &&
      y <= panelRect.bottom
    );
  }

  private buildPanelHTML(info: ElementInfo): string {
    const propsHTML = this.buildPropsHTML(info.props);
    const treeHTML = this.buildTreeHTML(info.hierarchy || []);
    const fullPath = `${info.source.fileName}:${info.source.lineNumber}`;
    const currentStyle = this.styleObjectToString(info.style || {});

    return `
      <div class="panel-header">
        <div class="panel-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        <div class="panel-title">&lt;${info.componentName}&gt;</div>
        <div class="panel-tag">${info.tagName}</div>
      </div>

      <div class="panel-body">
        <div class="section">
          <div class="section-header">
            <span class="section-icon">📁</span>
            Source File
          </div>
          <div class="file-info">
            <div class="file-path">${this.escapeHtml(info.source.fileName)}</div>
            <div class="file-location">
              Line <span>${info.source.lineNumber}</span>${info.source.columnNumber ? `, Column <span>${info.source.columnNumber}</span>` : ''}
            </div>
          </div>
          <div class="actions">
            <button class="action-btn open-ide-btn" data-action="open-ide"
                    data-file="${this.escapeHtml(info.source.fileName)}"
                    data-line="${info.source.lineNumber}"
                    data-col="${info.source.columnNumber || 1}">
              <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
              Open in IDE
            </button>
            <button class="action-btn" data-action="copy-path" data-value="${this.escapeHtml(fullPath)}">
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              Copy Path
            </button>
            <button class="action-btn" data-action="copy-component" data-value="<${this.escapeHtml(info.componentName)} />">
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              Copy Component
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">✏️</span>
            Live Edit
          </div>
          <div class="edit-section">
            <div class="edit-field">
              <label class="edit-label">className</label>
              <input type="text" class="edit-input" id="edit-classname"
                     value="${this.escapeHtml(info.className || '')}"
                     data-original="${this.escapeHtml(info.className || '')}"
                     placeholder="Enter class names...">
            </div>
            <div class="edit-field">
              <label class="edit-label">style</label>
              <div class="style-editor" id="style-editor">
                ${this.buildStyleEditorHTML()}
              </div>
              <button class="style-add-btn" id="add-style-rule">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add property
              </button>
            </div>
            <div class="edit-field">
              <label class="edit-label">HTML</label>
              <textarea class="edit-input" id="edit-html" rows="4"
                        data-original="${this.escapeHtml(this.originalOuterHTML)}"
                        placeholder="Edit HTML (outerHTML)...">${this.escapeHtml(this.originalOuterHTML)}</textarea>
            </div>
            <div class="edit-actions">
              <button class="save-btn" id="copy-changes">
                <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy Changes
              </button>
              <button class="reset-btn" id="reset-changes">Reset</button>
            </div>
            <div id="status-container"></div>
          </div>
        </div>

        <!-- Datalists for autocomplete -->
        <datalist id="css-properties">
          ${CSS_PROPERTIES.map(p => `<option value="${p}">`).join('')}
        </datalist>

        ${propsHTML ? `
        <div class="section">
          <div class="section-header">
            <span class="section-icon">⚙️</span>
            Props
          </div>
          ${propsHTML}
        </div>
        ` : ''}

        ${treeHTML ? `
        <div class="section">
          <div class="section-header">
            <span class="section-icon">🌳</span>
            Component Tree
          </div>
          ${treeHTML}
        </div>
        ` : ''}
      </div>

      <div class="panel-footer">
        <div class="footer-hint">
          <span class="kbd">Esc</span> or click outside to close
        </div>
        <div>SourceSnap</div>
      </div>
    `;
  }

  private styleObjectToString(style: Record<string, string>): string {
    return Object.entries(style).map(([k, v]) => `${k}: ${v}`).join('; ');
  }

  private parseStyleString(styleStr: string): Array<{ property: string; value: string; enabled: boolean }> {
    if (!styleStr) return [];

    return styleStr
      .split(';')
      .map(rule => rule.trim())
      .filter(rule => rule.includes(':'))
      .map(rule => {
        const colonIndex = rule.indexOf(':');
        return {
          property: rule.slice(0, colonIndex).trim(),
          value: rule.slice(colonIndex + 1).trim(),
          enabled: true,
        };
      });
  }

  private buildStyleEditorHTML(): string {
    if (this.styleRules.length === 0) {
      return '<div class="no-props" style="padding: 8px 0; color: #6b7280; font-style: italic;">No inline styles</div>';
    }

    return this.styleRules.map((rule, index) => `
      <div class="style-row" data-index="${index}">
        <input type="checkbox" class="style-checkbox" ${rule.enabled ? 'checked' : ''} data-index="${index}">
        <input type="text" class="style-property" value="${this.escapeHtml(rule.property)}"
               list="css-properties" placeholder="property" data-index="${index}">
        <span class="style-colon">:</span>
        <input type="text" class="style-value" value="${this.escapeHtml(rule.value)}"
               list="css-values-${index}" placeholder="value" data-index="${index}">
        <datalist id="css-values-${index}">
          ${(CSS_VALUES[rule.property] || []).map(v => `<option value="${v}">`).join('')}
        </datalist>
        <button class="style-delete" data-index="${index}">✕</button>
      </div>
    `).join('');
  }

  private applyStyleRules(): void {
    if (!this.currentInfo?.element) return;

    const enabledRules = this.styleRules.filter(r => r.enabled && r.property && r.value);
    const styleStr = enabledRules.map(r => `${r.property}: ${r.value}`).join('; ');

    this.currentInfo.element.setAttribute('style', styleStr);
  }

  private updateValueDatalist(propertyInput: HTMLInputElement, index: number): void {
    const property = propertyInput.value;
    const datalist = this.shadowRoot.querySelector(`#css-values-${index}`) as HTMLDataListElement;
    if (datalist && CSS_VALUES[property]) {
      datalist.innerHTML = CSS_VALUES[property].map(v => `<option value="${v}">`).join('');
    }
  }

  private refreshStyleEditor(): void {
    const editor = this.panel.querySelector('#style-editor');
    if (editor) {
      editor.innerHTML = this.buildStyleEditorHTML();
      this.attachStyleEditorListeners();
    }
  }

  private attachStyleEditorListeners(): void {
    // Checkbox listeners (enable/disable rule)
    const checkboxes = this.panel.querySelectorAll('.style-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const index = parseInt((e.target as HTMLInputElement).dataset.index || '0');
        this.styleRules[index].enabled = (e.target as HTMLInputElement).checked;
        this.applyStyleRules();
      });
    });

    // Property input listeners
    const propertyInputs = this.panel.querySelectorAll('.style-property');
    propertyInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt((e.target as HTMLInputElement).dataset.index || '0');
        this.styleRules[index].property = (e.target as HTMLInputElement).value;
        this.updateValueDatalist(e.target as HTMLInputElement, index);
        this.applyStyleRules();
      });
    });

    // Value input listeners
    const valueInputs = this.panel.querySelectorAll('.style-value');
    valueInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt((e.target as HTMLInputElement).dataset.index || '0');
        this.styleRules[index].value = (e.target as HTMLInputElement).value;
        this.applyStyleRules();
      });
    });

    // Delete button listeners
    const deleteButtons = this.panel.querySelectorAll('.style-delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt((e.target as HTMLButtonElement).dataset.index || '0');
        this.styleRules.splice(index, 1);
        this.refreshStyleEditor();
        this.applyStyleRules();
      });
    });
  }

  private buildPropsHTML(props?: Record<string, any>): string {
    if (!props || Object.keys(props).length === 0) {
      return '<div class="no-props">No props</div>';
    }

    const items = Object.entries(props).slice(0, 10).map(([key, value]) => {
      const valueType = this.getValueType(value);
      const displayValue = this.formatValue(value);
      return `
        <div class="prop-item">
          <span class="prop-name">${this.escapeHtml(key)}</span>
          <span class="prop-equals">=</span>
          <span class="prop-value ${valueType}">${this.escapeHtml(displayValue)}</span>
        </div>
      `;
    }).join('');

    const remaining = Object.keys(props).length - 10;
    const moreText = remaining > 0 ? `<div class="no-props">...and ${remaining} more</div>` : '';

    return `<div class="props-list">${items}${moreText}</div>`;
  }

  private buildTreeHTML(hierarchy: ComponentNode[]): string {
    if (!hierarchy || hierarchy.length === 0) {
      return '';
    }

    const items = hierarchy.slice(0, 15).map((node, index) => {
      const indent = '└─';
      const hasSource = !!node.source;
      const fileInfo = node.source
        ? `${this.getShortFileName(node.source.fileName)}:<span>${node.source.lineNumber}</span>`
        : '<span class="tree-no-source">no source</span>';

      return `
        <div class="tree-item ${node.isCurrentTarget ? 'current' : ''}"
             data-index="${index}"
             ${hasSource ? `data-file="${this.escapeHtml(node.source!.fileName)}" data-line="${node.source!.lineNumber}" data-col="${node.source!.columnNumber || 1}"` : ''}>
          <div class="tree-indent">${index > 0 ? indent : '●'}</div>
          <div class="tree-content">
            <div class="tree-name">&lt;${this.escapeHtml(node.name)}&gt;</div>
            <div class="tree-file">${fileInfo}</div>
          </div>
        </div>
      `;
    }).join('');

    const remaining = hierarchy.length - 15;
    const moreText = remaining > 0 ? `<div class="no-props">...and ${remaining} more parents</div>` : '';

    return `<div class="tree">${items}${moreText}</div>`;
  }

  private attachEventListeners(): void {
    // Open in IDE button handler
    const openIdeBtn = this.panel.querySelector('.open-ide-btn');
    if (openIdeBtn) {
      openIdeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = openIdeBtn.getAttribute('data-file');
        const line = openIdeBtn.getAttribute('data-line');
        const col = openIdeBtn.getAttribute('data-col');
        if (file) {
          this.openInEditor({
            fileName: file,
            lineNumber: parseInt(line || '1', 10),
            columnNumber: parseInt(col || '1', 10),
          });
        }
      });
    }

    // Tree item click handlers
    const items = this.panel.querySelectorAll('.tree-item[data-file]');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = item.getAttribute('data-file');
        const line = item.getAttribute('data-line');
        const col = item.getAttribute('data-col');
        if (file) {
          this.openInEditor({
            fileName: file,
            lineNumber: parseInt(line || '1', 10),
            columnNumber: parseInt(col || '1', 10),
          });
        }
      });
    });

    // Copy button handlers
    const copyBtns = this.panel.querySelectorAll('.action-btn[data-action^="copy"]');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const value = btn.getAttribute('data-value');
        if (value) {
          try {
            await navigator.clipboard.writeText(value);
            btn.classList.add('copied');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!`;
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.innerHTML = originalText;
            }, 1500);
          } catch (err) {
            // Failed to copy
          }
        }
      });
    });

    // Live edit handlers
    const classInput = this.panel.querySelector('#edit-classname') as HTMLInputElement;
    const resetBtn = this.panel.querySelector('#reset-changes');
    const addStyleBtn = this.panel.querySelector('#add-style-rule');

    // className input listener
    if (classInput) {
      classInput.addEventListener('input', () => {
        if (this.currentInfo?.element) {
          this.currentInfo.element.className = classInput.value;
          classInput.classList.toggle('modified', classInput.value !== classInput.dataset.original);
        }
      });
    }

    // HTML editor listener
    const htmlInput = this.panel.querySelector('#edit-html') as HTMLTextAreaElement;
    if (htmlInput) {
      htmlInput.addEventListener('input', () => {
        if (this.currentInfo?.element) {
          try {
            // Use outerHTML to replace the entire element
            this.currentInfo.element.outerHTML = htmlInput.value;
            htmlInput.classList.toggle('modified', htmlInput.value !== htmlInput.dataset.original);
          } catch (e) {
            // Invalid HTML
          }
        }
      });
    }

    // Attach style editor listeners
    this.attachStyleEditorListeners();

    // Add new style property button
    if (addStyleBtn) {
      addStyleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.styleRules.push({ property: '', value: '', enabled: true });
        this.refreshStyleEditor();
        // Focus the new property input
        const newInput = this.panel.querySelector(`.style-property[data-index="${this.styleRules.length - 1}"]`) as HTMLInputElement;
        if (newInput) newInput.focus();
      });
    }

    // Copy changes button
    const copyChangesBtn = this.panel.querySelector('#copy-changes');
    if (copyChangesBtn) {
      copyChangesBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.copyChanges();
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetChanges();
      });
    }
  }

  private async copyChanges(): Promise<void> {
    if (!this.currentInfo) return;

    const classInput = this.panel.querySelector('#edit-classname') as HTMLInputElement;
    const htmlInput = this.panel.querySelector('#edit-html') as HTMLTextAreaElement;

    const newClassName = classInput?.value || '';
    const newHTML = htmlInput?.value || '';

    // Build current style string from rules
    const enabledRules = this.styleRules.filter(r => r.enabled && r.property && r.value);
    const newStyleStr = enabledRules.map(r => `${r.property}: ${r.value}`).join('; ');

    // Check if there are changes
    const classChanged = newClassName !== this.originalClassName;
    const styleChanged = newStyleStr !== this.originalStyle;
    const htmlChanged = newHTML !== this.originalOuterHTML;

    if (!classChanged && !styleChanged && !htmlChanged) {
      this.showStatus('info', 'No changes to copy');
      return;
    }

    // Build the code snippet to copy
    const parts: string[] = [];

    // Always include className if there's any change
    if (newClassName) {
      parts.push(`className="${newClassName}"`);
    }

    // Always include style if there are any style rules
    if (enabledRules.length > 0) {
      const jsxParts = enabledRules.map(r => {
        const camelProp = r.property.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const numValue = parseFloat(r.value);
        if (!isNaN(numValue) && r.value === String(numValue)) {
          return `${camelProp}: ${numValue}`;
        }
        return `${camelProp}: '${r.value}'`;
      });
      parts.push(`style={{ ${jsxParts.join(', ')} }}`);
    }

    // Build full copy string
    let codeToCopy = parts.join(' ');

    // If HTML changed, copy the full HTML instead
    if (htmlChanged) {
      codeToCopy = newHTML;
    }

    try {
      await navigator.clipboard.writeText(codeToCopy);
      this.showStatus('success', `Copied! Paste in ${this.getShortFileName(this.currentInfo.source.fileName)}:${this.currentInfo.source.lineNumber}`);

      // Update original values
      this.originalClassName = newClassName;
      this.originalStyle = newStyleStr;
      this.originalOuterHTML = newHTML;

      // Remove modified classes
      classInput?.classList.remove('modified');
      htmlInput?.classList.remove('modified');
      if (classInput) classInput.dataset.original = newClassName;
      if (htmlInput) htmlInput.dataset.original = newHTML;
    } catch (err) {
      this.showStatus('error', 'Failed to copy to clipboard');
    }
  }

  private cssToJsxStyle(cssString: string): string {
    if (!cssString) return '';

    return cssString
      .split(';')
      .filter(rule => rule.trim())
      .map(rule => {
        const colonIndex = rule.indexOf(':');
        if (colonIndex === -1) return '';

        const prop = rule.slice(0, colonIndex).trim();
        const value = rule.slice(colonIndex + 1).trim();
        if (!prop || !value) return '';

        // Convert kebab-case to camelCase
        const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

        // Check if value is a number
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && value === String(numValue)) {
          return `${camelProp}: ${numValue}`;
        }

        return `${camelProp}: '${value}'`;
      })
      .filter(Boolean)
      .join(', ');
  }

  private resetChanges(): void {
    const classInput = this.panel.querySelector('#edit-classname') as HTMLInputElement;
    const htmlInput = this.panel.querySelector('#edit-html') as HTMLTextAreaElement;

    if (classInput && this.currentInfo?.element) {
      classInput.value = this.originalClassName;
      this.currentInfo.element.className = this.originalClassName;
      classInput.classList.remove('modified');
    }

    // Reset style rules to original
    this.styleRules = this.parseStyleString(this.originalStyle);
    this.refreshStyleEditor();

    if (this.currentInfo?.element) {
      this.currentInfo.element.setAttribute('style', this.originalStyle);
    }

    // Reset HTML
    if (htmlInput && this.currentInfo?.element) {
      htmlInput.value = this.originalOuterHTML;
      try {
        this.currentInfo.element.outerHTML = this.originalOuterHTML;
      } catch (e) {
        // Reset HTML error
      }
      htmlInput.classList.remove('modified');
    }

    this.showStatus('info', 'Changes reset');
  }

  private showStatus(type: 'success' | 'error' | 'info', message: string): void {
    const container = this.panel.querySelector('#status-container');
    if (container) {
      container.innerHTML = `<div class="status-message ${type}">${message}</div>`;
      setTimeout(() => {
        container.innerHTML = '';
      }, 3000);
    }
  }

  private openInEditor(source: SourceInfo): void {
    try {
      const url = buildEditorUrl(this.editor, source, this.projectPathPrefix);
      window.location.href = url;
    } catch (error) {
      // Failed to open editor
    }
  }

  private getShortFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts.slice(-2).join('/');
  }

  private getValueType(value: any): string {
    if (value === null || value === undefined) return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'function' || (typeof value === 'string' && value.startsWith('ƒ'))) return 'function';
    return 'object';
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      if (value.startsWith('ƒ') || value.startsWith('<')) return value;
      return `"${value}"`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private positionPanel(targetRect: DOMRect): void {
    const panelWidth = 380;
    const panelHeight = Math.min(600, window.innerHeight - 40);
    const padding = 20;
    const gap = 12;

    let top: number;
    let left: number;

    // Try to position to the right of the element
    left = targetRect.right + gap;
    top = targetRect.top;

    // If panel goes off right edge, position to the left
    if (left + panelWidth > window.innerWidth - padding) {
      left = targetRect.left - panelWidth - gap;
    }

    // If still off screen, position below
    if (left < padding) {
      left = Math.max(padding, (window.innerWidth - panelWidth) / 2);
      top = targetRect.bottom + gap;
    }

    // Clamp vertical position
    top = Math.max(padding, Math.min(top, window.innerHeight - panelHeight - padding));

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }

  destroy(): void {
    this.container.remove();
  }
}
