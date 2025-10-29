// import { ItemView, WorkspaceLeaf, MarkdownView, Editor } from 'obsidian';
import { ItemView, WorkspaceLeaf, MarkdownView, Editor, Notice, Modal, Setting } from 'obsidian';
import LatexSnippetsPlugin, { LatexSnippet } from './main';

export const VIEW_TYPE_LATEX_SNIPPETS = 'latex-snippets-view';

class AddSnippetModal extends Modal {
    plugin: LatexSnippetsPlugin;
    onSubmit: (snippet: LatexSnippet) => void;

    constructor(app: any, plugin: LatexSnippetsPlugin, onSubmit: (snippet: LatexSnippet) => void) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Add Custom LaTeX Snippet' });

        let name = '';
        let command = '';
        let category = '';
        let description = '';

        new Setting(contentEl)
            .setName('Name')
            .setDesc('Display name for the snippet')
            .addText(text => text
                .setPlaceholder('e.g., Custom Fraction')
                .onChange(value => { name = value; }));

        new Setting(contentEl)
            .setName('Command')
            .setDesc('LaTeX command (without $ delimiters)')
            .addText(text => text
                .setPlaceholder('e.g., \\frac{a}{b}')
                .onChange(value => { command = value; }));

        new Setting(contentEl)
            .setName('Category')
            .setDesc('Category for organization')
            .addText(text => text
                .setPlaceholder('e.g., Custom Functions')
                .onChange(value => { category = value; }));

        new Setting(contentEl)
            .setName('Description (Optional)')
            .setDesc('Brief description of the snippet')
            .addText(text => text
                .setPlaceholder('e.g., Custom fraction format')
                .onChange(value => { description = value; }));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Add Snippet')
                .setCta()
                .onClick(() => {
                    if (!name.trim() || !command.trim()) {
                        new Notice('Name and command are required');
                        return;
                    }
                    
                    const snippet: LatexSnippet = {
                        name: name.trim(),
                        command: command.trim(),
                        category: category.trim() || 'Custom',
                        description: description.trim() || undefined,
                        isCustom: true
                    };
                    
                    this.onSubmit(snippet);
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => {
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class LatexSnippetsView extends ItemView {
    plugin: LatexSnippetsPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: LatexSnippetsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE_LATEX_SNIPPETS;
    }

    getDisplayText() {
        return 'LaTeX Snippets';
    }

    getIcon() {
        return 'sigma';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        
        // Header with title and add button
        const headerEl = container.createDiv('snippets-header');
        headerEl.createEl('h4', { text: 'LaTeX Snippets' });
        
        const addButton = headerEl.createEl('button', {
            text: '+ Add Custom',
            cls: 'add-snippet-button'
        });
        
        addButton.addEventListener('click', () => {
            this.openAddSnippetModal();
        });

        this.createSnippetsContainer(container);
    }

    private openAddSnippetModal() {
        new AddSnippetModal(this.app, this.plugin, (snippet) => {
            this.addCustomSnippet(snippet);
        }).open();
    }

    private async addCustomSnippet(snippet: LatexSnippet) {
        try {
            // Add to plugin settings
            this.plugin.settings.customSnippets.push(snippet);
            await this.plugin.saveSettings();
            
            // Refresh the view
            this.refresh();
            
            new Notice(`Added snippet: ${snippet.name}`);
        } catch (error) {
            console.error('Error adding custom snippet:', error);
            new Notice('Error adding custom snippet');
        }
    }

    private async deleteCustomSnippet(snippet: LatexSnippet) {
        try {
            // Find and remove from plugin settings
            const index = this.plugin.settings.customSnippets.findIndex(s => 
                s.name === snippet.name && s.command === snippet.command
            );
            
            if (index > -1) {
                this.plugin.settings.customSnippets.splice(index, 1);
                await this.plugin.saveSettings();
                
                // Refresh the view
                this.refresh();
                
                new Notice(`Deleted snippet: ${snippet.name}`);
            } else {
                new Notice('Snippet not found');
            }
        } catch (error) {
            console.error('Error deleting custom snippet:', error);
            new Notice('Error deleting custom snippet');
        }
    }

    private refresh() {
        // Clear and rebuild the container
        const container = this.containerEl.children[1];
        container.empty();
        
        // Recreate header
        const headerEl = container.createDiv('snippets-header');
        headerEl.createEl('h4', { text: 'LaTeX Snippets' });
        
        const addButton = headerEl.createEl('button', {
            text: '+ Add Custom',
            cls: 'add-snippet-button'
        });
        
        addButton.addEventListener('click', () => {
            this.openAddSnippetModal();
        });

        this.createSnippetsContainer(container);
    }

    private createSnippetsContainer(container: Element) {
        const snippetsData = this.getSnippetsData();
        const categories = this.groupSnippetsByCategory(snippetsData);

        // Create search box
        const searchContainer = container.createDiv('search-container');
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search snippets...',
            cls: 'latex-search-input'
        });

        searchInput.addEventListener('input', (e) => {
            const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            this.filterSnippets(searchTerm);
        });

        // Create snippets container
        const snippetsContainer = container.createDiv('snippets-container');

        Object.entries(categories).forEach(([category, snippets]) => {
            const categoryEl = snippetsContainer.createDiv('snippet-category');
            categoryEl.createEl('h5', { text: category, cls: 'category-title' });
            const snippetsList = categoryEl.createDiv('snippets-list');

            snippets.forEach(snippet => {
                const snippetEl = snippetsList.createDiv('snippet-item');
                snippetEl.setAttribute('data-name', snippet.name.toLowerCase());
                snippetEl.setAttribute('data-command', snippet.command.toLowerCase());
                
                const nameEl = snippetEl.createDiv('snippet-name');
                nameEl.textContent = snippet.name;
                
                const commandEl = snippetEl.createDiv('snippet-command');
                commandEl.textContent = snippet.command;
                
                if (snippet.description) {
                    const descEl = snippetEl.createDiv('snippet-description');
                    descEl.textContent = snippet.description;
                }

                // Add delete button for custom snippets (positioned absolutely or floated)
                if (snippet.isCustom) {
                    const deleteButton = snippetEl.createEl('button', {
                        text: '×',
                        cls: 'snippet-delete-button',
                        attr: { title: 'Delete custom snippet' }
                    });
                    
                    deleteButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent triggering the snippet insertion
                        
                        // Confirm deletion
                        if (confirm(`Delete snippet "${snippet.name}"?`)) {
                            this.deleteCustomSnippet(snippet);
                        }
                    });
                    
                    snippetEl.addClass('custom-snippet');
                }

                // Main click handler for snippet insertion (on the whole element)
                snippetEl.addEventListener('click', (e) => {
                    // Don't trigger if clicking on delete button
                    if ((e.target as HTMLElement).classList.contains('snippet-delete-button')) {
                        return;
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Snippet clicked:', snippet.command);
                    this.insertSnippet(snippet.command);
                });

                // Add hover effect
                snippetEl.addEventListener('mouseenter', () => {
                    snippetEl.addClass('snippet-hover');
                });
                snippetEl.addEventListener('mouseleave', () => {
                    snippetEl.removeClass('snippet-hover');
                });
            });
        });
    }

    private getSnippetsData(): LatexSnippet[] {
        const defaultSnippets: LatexSnippet[] = [
            // Greek Letters (lowercase)
            { name: 'Alpha', command: '\\alpha', category: 'Greek Letters' },
            { name: 'Beta', command: '\\beta', category: 'Greek Letters' },
            { name: 'Gamma', command: '\\gamma', category: 'Greek Letters' },
            { name: 'Delta', command: '\\delta', category: 'Greek Letters' },
            { name: 'Epsilon', command: '\\epsilon', category: 'Greek Letters' },
            { name: 'Varepsilon', command: '\\varepsilon', category: 'Greek Letters' },
            { name: 'Zeta', command: '\\zeta', category: 'Greek Letters' },
            { name: 'Eta', command: '\\eta', category: 'Greek Letters' },
            { name: 'Theta', command: '\\theta', category: 'Greek Letters' },
            { name: 'Vartheta', command: '\\vartheta', category: 'Greek Letters' },
            { name: 'Iota', command: '\\iota', category: 'Greek Letters' },
            { name: 'Kappa', command: '\\kappa', category: 'Greek Letters' },
            { name: 'Lambda', command: '\\lambda', category: 'Greek Letters' },
            { name: 'Mu', command: '\\mu', category: 'Greek Letters' },
            { name: 'Nu', command: '\\nu', category: 'Greek Letters' },
            { name: 'Xi', command: '\\xi', category: 'Greek Letters' },
            { name: 'Pi', command: '\\pi', category: 'Greek Letters' },
            { name: 'Varpi', command: '\\varpi', category: 'Greek Letters' },
            { name: 'Rho', command: '\\rho', category: 'Greek Letters' },
            { name: 'Varrho', command: '\\varrho', category: 'Greek Letters' },
            { name: 'Sigma', command: '\\sigma', category: 'Greek Letters' },
            { name: 'Varsigma', command: '\\varsigma', category: 'Greek Letters' },
            { name: 'Tau', command: '\\tau', category: 'Greek Letters' },
            { name: 'Upsilon', command: '\\upsilon', category: 'Greek Letters' },
            { name: 'Phi', command: '\\phi', category: 'Greek Letters' },
            { name: 'Varphi', command: '\\varphi', category: 'Greek Letters' },
            { name: 'Chi', command: '\\chi', category: 'Greek Letters' },
            { name: 'Psi', command: '\\psi', category: 'Greek Letters' },
            { name: 'Omega', command: '\\omega', category: 'Greek Letters' },

            // Greek Letters (uppercase)
            { name: 'Gamma (uppercase)', command: '\\Gamma', category: 'Greek Letters' },
            { name: 'Delta (uppercase)', command: '\\Delta', category: 'Greek Letters' },
            { name: 'Theta (uppercase)', command: '\\Theta', category: 'Greek Letters' },
            { name: 'Lambda (uppercase)', command: '\\Lambda', category: 'Greek Letters' },
            { name: 'Xi (uppercase)', command: '\\Xi', category: 'Greek Letters' },
            { name: 'Pi (uppercase)', command: '\\Pi', category: 'Greek Letters' },
            { name: 'Sigma (uppercase)', command: '\\Sigma', category: 'Greek Letters' },
            { name: 'Upsilon (uppercase)', command: '\\Upsilon', category: 'Greek Letters' },
            { name: 'Phi (uppercase)', command: '\\Phi', category: 'Greek Letters' },
            { name: 'Psi (uppercase)', command: '\\Psi', category: 'Greek Letters' },
            { name: 'Omega (uppercase)', command: '\\Omega', category: 'Greek Letters' },

            // Hebrew Letters
            { name: 'Aleph', command: '\\aleph', category: 'Hebrew Letters' },
            { name: 'Beth', command: '\\beth', category: 'Hebrew Letters' },
            { name: 'Gimel', command: '\\gimel', category: 'Hebrew Letters' },
            { name: 'Daleth', command: '\\daleth', category: 'Hebrew Letters' },

            // Delimiters
            { name: 'Norm', command: '\\Vert', category: 'Delimiters', description: 'Double vertical bars' },
            { name: 'Absolute Value', command: '\\vert', category: 'Delimiters', description: 'Single vertical bar' },
            { name: 'Left Parenthesis', command: '\\left(', category: 'Delimiters' },
            { name: 'Right Parenthesis', command: '\\right)', category: 'Delimiters' },
            { name: 'Left Bracket', command: '\\left[', category: 'Delimiters' },
            { name: 'Right Bracket', command: '\\right]', category: 'Delimiters' },
            { name: 'Left Brace', command: '\\left\\{', category: 'Delimiters' },
            { name: 'Right Brace', command: '\\right\\}', category: 'Delimiters' },
            { name: 'Left Angle', command: '\\langle', category: 'Delimiters' },
            { name: 'Right Angle', command: '\\rangle', category: 'Delimiters' },
            { name: 'Left Ceiling', command: '\\lceil', category: 'Delimiters' },
            { name: 'Right Ceiling', command: '\\rceil', category: 'Delimiters' },
            { name: 'Left Floor', command: '\\lfloor', category: 'Delimiters' },
            { name: 'Right Floor', command: '\\rfloor', category: 'Delimiters' },

            // Binary Operators
            { name: 'Plus/Minus', command: '\\pm', category: 'Operators' },
            { name: 'Minus/Plus', command: '\\mp', category: 'Operators' },
            { name: 'Multiply', command: '\\times', category: 'Operators' },
            { name: 'Divide', command: '\\div', category: 'Operators' },
            { name: 'Dot Product', command: '\\cdot', category: 'Operators' },
            { name: 'Asterisk', command: '\\ast', category: 'Operators' },
            { name: 'Star', command: '\\star', category: 'Operators' },
            { name: 'Circle', command: '\\circ', category: 'Operators' },
            { name: 'Bullet', command: '\\bullet', category: 'Operators' },
            { name: 'Cap', command: '\\cap', category: 'Operators' },
            { name: 'Cup', command: '\\cup', category: 'Operators' },
            { name: 'Union Plus', command: '\\uplus', category: 'Operators' },
            { name: 'Square Cap', command: '\\sqcap', category: 'Operators' },
            { name: 'Square Cup', command: '\\sqcup', category: 'Operators' },
            { name: 'Vee', command: '\\vee', category: 'Operators' },
            { name: 'Wedge', command: '\\wedge', category: 'Operators' },
            { name: 'Set Minus', command: '\\setminus', category: 'Operators' },
            { name: 'WR', command: '\\wr', category: 'Operators' },
            { name: 'Diamond', command: '\\diamond', category: 'Operators' },
            { name: 'Big Triangle Up', command: '\\bigtriangleup', category: 'Operators' },
            { name: 'Big Triangle Down', command: '\\bigtriangledown', category: 'Operators' },
            { name: 'Triangle Left', command: '\\triangleleft', category: 'Operators' },
            { name: 'Triangle Right', command: '\\triangleright', category: 'Operators' },
            { name: 'Left Join', command: '\\lhd', category: 'Operators' },
            { name: 'Right Join', command: '\\rhd', category: 'Operators' },
            { name: 'Unleft Join', command: '\\unlhd', category: 'Operators' },
            { name: 'Unright Join', command: '\\unrhd', category: 'Operators' },
            { name: 'O Plus', command: '\\oplus', category: 'Operators' },
            { name: 'O Minus', command: '\\ominus', category: 'Operators' },
            { name: 'O Times', command: '\\otimes', category: 'Operators' },
            { name: 'O Slash', command: '\\oslash', category: 'Operators' },
            { name: 'O Dot', command: '\\odot', category: 'Operators' },
            { name: 'Big Circle', command: '\\bigcirc', category: 'Operators' },
            { name: 'Dagger', command: '\\dagger', category: 'Operators' },
            { name: 'Double Dagger', command: '\\ddagger', category: 'Operators' },
            { name: 'Amalg', command: '\\amalg', category: 'Operators' },

            // Relations
            { name: 'Equal', command: '=', category: 'Relations' },
            { name: 'Not Equal', command: '\\neq', category: 'Relations' },
            { name: 'Less Than', command: '<', category: 'Relations' },
            { name: 'Greater Than', command: '>', category: 'Relations' },
            { name: 'Less Equal', command: '\\leq', category: 'Relations' },
            { name: 'Greater Equal', command: '\\geq', category: 'Relations' },
            { name: 'Less Equal (double)', command: '\\leqq', category: 'Relations' },
            { name: 'Greater Equal (double)', command: '\\geqq', category: 'Relations' },
            { name: 'Less Not Equal', command: '\\lneq', category: 'Relations' },
            { name: 'Greater Not Equal', command: '\\gneq', category: 'Relations' },
            { name: 'Less Not Equal (double)', command: '\\lneqq', category: 'Relations' },
            { name: 'Greater Not Equal (double)', command: '\\gneqq', category: 'Relations' },
            { name: 'Much Less', command: '\\ll', category: 'Relations' },
            { name: 'Much Greater', command: '\\gg', category: 'Relations' },
            { name: 'Approximately', command: '\\approx', category: 'Relations' },
            { name: 'Similar', command: '\\sim', category: 'Relations' },
            { name: 'Similar Equal', command: '\\simeq', category: 'Relations' },
            { name: 'Congruent', command: '\\cong', category: 'Relations' },
            { name: 'Equivalent', command: '\\equiv', category: 'Relations' },
            { name: 'Proportional', command: '\\propto', category: 'Relations' },
            { name: 'Precedes', command: '\\prec', category: 'Relations' },
            { name: 'Succeeds', command: '\\succ', category: 'Relations' },
            { name: 'Precedes Equal', command: '\\preceq', category: 'Relations' },
            { name: 'Succeeds Equal', command: '\\succeq', category: 'Relations' },
            { name: 'Parallel', command: '\\parallel', category: 'Relations' },
            { name: 'Perpendicular', command: '\\perp', category: 'Relations' },
            { name: 'Mid', command: '\\mid', category: 'Relations' },
            { name: 'N Mid', command: '\\nmid', category: 'Relations' },
            { name: 'Asymp', command: '\\asymp', category: 'Relations' },
            { name: 'Bowtie', command: '\\bowtie', category: 'Relations' },
            { name: 'Join', command: '\\Join', category: 'Relations' },
            { name: 'Smile', command: '\\smile', category: 'Relations' },
            { name: 'Frown', command: '\\frown', category: 'Relations' },

            // Set Relations
            { name: 'In', command: '\\in', category: 'Sets' },
            { name: 'Not In', command: '\\notin', category: 'Sets' },
            { name: 'Ni', command: '\\ni', category: 'Sets' },
            { name: 'Not Ni', command: '\\notni', category: 'Sets' },
            { name: 'Subset', command: '\\subset', category: 'Sets' },
            { name: 'Superset', command: '\\supset', category: 'Sets' },
            { name: 'Subset Equal', command: '\\subseteq', category: 'Sets' },
            { name: 'Superset Equal', command: '\\supseteq', category: 'Sets' },
            { name: 'Square Subset', command: '\\sqsubset', category: 'Sets' },
            { name: 'Square Superset', command: '\\sqsupset', category: 'Sets' },
            { name: 'Square Subset Equal', command: '\\sqsubseteq', category: 'Sets' },
            { name: 'Square Superset Equal', command: '\\sqsupseteq', category: 'Sets' },
            { name: 'Subset Not Equal', command: '\\subsetneq', category: 'Sets' },
            { name: 'Superset Not Equal', command: '\\supsetneq', category: 'Sets' },
            { name: 'Subset Not Equal (double)', command: '\\subsetneqq', category: 'Sets' },
            { name: 'Superset Not Equal (double)', command: '\\supsetneqq', category: 'Sets' },
            { name: 'Not Subset Equal', command: '\\nsubseteq', category: 'Sets' },
            { name: 'Not Superset Equal', command: '\\nsupseteq', category: 'Sets' },
            { name: 'Not Subset Equal (double)', command: '\\nsubseteqq', category: 'Sets' },
            { name: 'Not Superset Equal (double)', command: '\\nsupseteqq', category: 'Sets' },
            { name: 'Union', command: '\\cup', category: 'Sets' },
            { name: 'Intersection', command: '\\cap', category: 'Sets' },
            { name: 'Emptyset', command: '\\emptyset', category: 'Sets' },
            { name: 'Varnothing', command: '\\varnothing', category: 'Sets' },

            // Functions
            { name: 'Fraction', command: '\\frac{}{}', category: 'Functions' },
            { name: 'Binomial', command: '\\binom{}{}', category: 'Functions' },
            { name: 'Square Root', command: '\\sqrt{}', category: 'Functions' },
            { name: 'Nth Root', command: '\\sqrt[n]{}', category: 'Functions' },
            { name: 'Sum', command: '\\sum_{i=1}^{n}', category: 'Functions' },
            { name: 'Product', command: '\\prod_{i=1}^{n}', category: 'Functions' },
            { name: 'Coproduct', command: '\\coprod_{i=1}^{n}', category: 'Functions' },
            { name: 'Integral', command: '\\int_{a}^{b}', category: 'Functions' },
            { name: 'Double Integral', command: '\\iint', category: 'Functions' },
            { name: 'Triple Integral', command: '\\iiint', category: 'Functions' },
            { name: 'Contour Integral', command: '\\oint', category: 'Functions' },
            { name: 'Limit', command: '\\lim_{x \\to \\infty}', category: 'Functions' },
            { name: 'Sup', command: '\\sup', category: 'Functions' },
            { name: 'Inf', command: '\\inf', category: 'Functions' },
            { name: 'Max', command: '\\max', category: 'Functions' },
            { name: 'Min', command: '\\min', category: 'Functions' },
            { name: 'Arg Max', command: '\\arg\\max', category: 'Functions' },
            { name: 'Arg Min', command: '\\arg\\min', category: 'Functions' },
            { name: 'Det', command: '\\det', category: 'Functions' },
            { name: 'Gcd', command: '\\gcd', category: 'Functions' },
            { name: 'Lcm', command: '\\lcm', category: 'Functions' },
            { name: 'Deg', command: '\\deg', category: 'Functions' },
            { name: 'Dim', command: '\\dim', category: 'Functions' },
            { name: 'Ker', command: '\\ker', category: 'Functions' },
            { name: 'Hom', command: '\\hom', category: 'Functions' },

            // Trigonometric Functions
            { name: 'Sin', command: '\\sin', category: 'Trigonometric' },
            { name: 'Cos', command: '\\cos', category: 'Trigonometric' },
            { name: 'Tan', command: '\\tan', category: 'Trigonometric' },
            { name: 'Cot', command: '\\cot', category: 'Trigonometric' },
            { name: 'Sec', command: '\\sec', category: 'Trigonometric' },
            { name: 'Csc', command: '\\csc', category: 'Trigonometric' },
            { name: 'Arcsin', command: '\\arcsin', category: 'Trigonometric' },
            { name: 'Arccos', command: '\\arccos', category: 'Trigonometric' },
            { name: 'Arctan', command: '\\arctan', category: 'Trigonometric' },

            // Hyperbolic Functions
            { name: 'Sinh', command: '\\sinh', category: 'Hyperbolic' },
            { name: 'Cosh', command: '\\cosh', category: 'Hyperbolic' },
            { name: 'Tanh', command: '\\tanh', category: 'Hyperbolic' },
            { name: 'Coth', command: '\\coth', category: 'Hyperbolic' },

            // Logarithmic Functions
            { name: 'Log', command: '\\log', category: 'Logarithmic' },
            { name: 'Log (base 10)', command: '\\lg', category: 'Logarithmic' },
            { name: 'Natural Log', command: '\\ln', category: 'Logarithmic' },
            { name: 'Exp', command: '\\exp', category: 'Logarithmic' },

            // Arrows
            { name: 'Right Arrow', command: '\\rightarrow', category: 'Arrows' },
            { name: 'Left Arrow', command: '\\leftarrow', category: 'Arrows' },
            { name: 'Left Right Arrow', command: '\\leftrightarrow', category: 'Arrows' },
            { name: 'Implies', command: '\\Rightarrow', category: 'Arrows' },
            { name: 'Implied by', command: '\\Leftarrow', category: 'Arrows' },
            { name: 'Iff', command: '\\Leftrightarrow', category: 'Arrows' },
            { name: 'Maps to', command: '\\mapsto', category: 'Arrows' },
            { name: 'Long Right Arrow', command: '\\longrightarrow', category: 'Arrows' },
            { name: 'Long Left Arrow', command: '\\longleftarrow', category: 'Arrows' },
            { name: 'Long Left Right Arrow', command: '\\longleftrightarrow', category: 'Arrows' },
            { name: 'Long Implies', command: '\\Longrightarrow', category: 'Arrows' },
            { name: 'Long Implied by', command: '\\Longleftarrow', category: 'Arrows' },
            { name: 'Long Iff', command: '\\Longleftrightarrow', category: 'Arrows' },
            { name: 'Up Arrow', command: '\\uparrow', category: 'Arrows' },
            { name: 'Down Arrow', command: '\\downarrow', category: 'Arrows' },
            { name: 'Up Down Arrow', command: '\\updownarrow', category: 'Arrows' },
            { name: 'Double Up Arrow', command: '\\Uparrow', category: 'Arrows' },
            { name: 'Double Down Arrow', command: '\\Downarrow', category: 'Arrows' },
            { name: 'Double Up Down Arrow', command: '\\Updownarrow', category: 'Arrows' },
            { name: 'Up Up Arrows', command: '\\upuparrows', category: 'Arrows' },
            { name: 'Down Down Arrows', command: '\\downdownarrows', category: 'Arrows' },
            { name: 'Right Right Arrows', command: '\\rightrightarrows', category: 'Arrows' },
            { name: 'Left Left Arrows', command: '\\leftleftarrows', category: 'Arrows' },

            // Miscellaneous Symbols
            { name: 'Infinity', command: '\\infty', category: 'Miscellaneous' },
            { name: 'Partial', command: '\\partial', category: 'Miscellaneous' },
            { name: 'Nabla', command: '\\nabla', category: 'Miscellaneous' },
            { name: 'Exists', command: '\\exists', category: 'Miscellaneous' },
            { name: 'Not Exists', command: '\\nexists', category: 'Miscellaneous' },
            { name: 'For All', command: '\\forall', category: 'Miscellaneous' },
            { name: 'Not', command: '\\neg', category: 'Miscellaneous' },
            { name: 'Because', command: '\\because', category: 'Miscellaneous' },
            { name: 'Therefore', command: '\\therefore', category: 'Miscellaneous' },
            { name: 'QED', command: '\\qed', category: 'Miscellaneous' },
            { name: 'Box', command: '\\Box', category: 'Miscellaneous' },
            { name: 'Diamond', command: '\\Diamond', category: 'Miscellaneous' },
            { name: 'Triangle', command: '\\triangle', category: 'Miscellaneous' },
            { name: 'Angle', command: '\\angle', category: 'Miscellaneous' },
            { name: 'Measured Angle', command: '\\measuredangle', category: 'Miscellaneous' },
            { name: 'Spherical Angle', command: '\\sphericalangle', category: 'Miscellaneous' },
            { name: 'Top', command: '\\top', category: 'Miscellaneous' },
            { name: 'Bot', command: '\\bot', category: 'Miscellaneous' },
            { name: 'Flat', command: '\\flat', category: 'Miscellaneous' },
            { name: 'Natural', command: '\\natural', category: 'Miscellaneous' },
            { name: 'Sharp', command: '\\sharp', category: 'Miscellaneous' },
            { name: 'Clubsuit', command: '\\clubsuit', category: 'Miscellaneous' },
            { name: 'Diamondsuit', command: '\\diamondsuit', category: 'Miscellaneous' },
            { name: 'Heartsuit', command: '\\heartsuit', category: 'Miscellaneous' },
            { name: 'Spadesuit', command: '\\spadesuit', category: 'Miscellaneous' },

            // Large Operators
            { name: 'Big Cap', command: '\\bigcap', category: 'Large Operators' },
            { name: 'Big Cup', command: '\\bigcup', category: 'Large Operators' },
            { name: 'Big O Plus', command: '\\bigoplus', category: 'Large Operators' },
            { name: 'Big O Times', command: '\\bigotimes', category: 'Large Operators' },
            { name: 'Big O Dot', command: '\\bigodot', category: 'Large Operators' },
            { name: 'Big U Plus', command: '\\biguplus', category: 'Large Operators' },
            { name: 'Big Vee', command: '\\bigvee', category: 'Large Operators' },
            { name: 'Big Wedge', command: '\\bigwedge', category: 'Large Operators' },
            { name: 'Big Square Cup', command: '\\bigsqcup', category: 'Large Operators' },

            // Font Styles
            { name: 'Math Roman', command: '\\mathrm{}', category: 'Formatting' },
            { name: 'Math Italic', command: '\\mathit{}', category: 'Formatting' },
            { name: 'Math Bold', command: '\\mathbf{}', category: 'Formatting' },
            { name: 'Math Sans Serif', command: '\\mathsf{}', category: 'Formatting' },
            { name: 'Math Typewriter', command: '\\mathtt{}', category: 'Formatting' },
            { name: 'Math Calligraphy', command: '\\mathcal{}', category: 'Formatting' },
            { name: 'Math Script', command: '\\mathscr{}', category: 'Formatting' },
            { name: 'Math Fraktur', command: '\\mathfrak{}', category: 'Formatting' },
            { name: 'Math Blackboard Bold', command: '\\mathbb{}', category: 'Formatting' },

            // Common Blackboard Bold Letters
            { name: 'Real Numbers', command: '\\mathbb{R}', category: 'Number Sets' },
            { name: 'Complex Numbers', command: '\\mathbb{C}', category: 'Number Sets' },
            { name: 'Natural Numbers', command: '\\mathbb{N}', category: 'Number Sets' },
            { name: 'Integers', command: '\\mathbb{Z}', category: 'Number Sets' },
            { name: 'Rational Numbers', command: '\\mathbb{Q}', category: 'Number Sets' },
            { name: 'Field', command: '\\mathbb{F}', category: 'Number Sets' },
            { name: 'Prime Numbers', command: '\\mathbb{P}', category: 'Number Sets' },
            { name: 'Arbitrary Set X', command: '\\mathbb{X}', category: 'Number Sets' },

            // Common Sans Serif Letters
            { name: 'Sans Serif F', command: '\\mathsf{F}', category: 'Sans Serif' },
            { name: 'Sans Serif J', command: '\\mathsf{J}', category: 'Sans Serif' },

            // Common Bold Letters
            { name: 'Bold', command: '\\mathbf{}', category: 'Bold Letters' },

            // Letter-like Symbols
            { name: 'Ell', command: '\\ell', category: 'Letter-like' },
            { name: 'Hbar', command: '\\hbar', category: 'Letter-like' },
            { name: 'Imath', command: '\\imath', category: 'Letter-like' },
            { name: 'Jmath', command: '\\jmath', category: 'Letter-like' },
            { name: 'WP', command: '\\wp', category: 'Letter-like' },
            { name: 'Re', command: '\\Re', category: 'Letter-like' },
            { name: 'Im', command: '\\Im', category: 'Letter-like' },
            { name: 'Mho', command: '\\mho', category: 'Letter-like' },
            { name: 'Prime', command: '\\prime', category: 'Letter-like' },
            { name: 'Backprime', command: '\\backprime', category: 'Letter-like' },


            // Formatting
            { name: 'Superscript', command: '^{}', category: 'Formatting' },
            { name: 'Subscript', command: '_{}', category: 'Formatting' },
            { name: 'Text', command: '\\text{}', category: 'Formatting' },
            { name: 'Bold', command: '\\mathbf{}', category: 'Formatting' },
            { name: 'Overline', command: '\\overline{}', category: 'Formatting' },
            { name: 'Underline', command: '\\underline{}', category: 'Formatting' },
            { name: 'Hat', command: '\\hat{}', category: 'Formatting' },
            { name: 'Check', command: '\\check{}', category: 'Formatting' },
            { name: 'Breve', command: '\\breve{}', category: 'Formatting' },
            { name: 'Acute', command: '\\acute{}', category: 'Formatting' },
            { name: 'Grave', command: '\\grave{}', category: 'Formatting' },
            { name: 'Tilde', command: '\\tilde{}', category: 'Formatting' },
            { name: 'Bar', command: '\\bar{}', category: 'Formatting' },
            { name: 'Vec', command: '\\vec{}', category: 'Formatting' },
            { name: 'Dot', command: '\\dot{}', category: 'Formatting' },
            { name: 'Ddot', command: '\\ddot{}', category: 'Formatting' },
            { name: 'Wide Hat', command: '\\widehat{}', category: 'Formatting' },
            { name: 'Wide Tilde', command: '\\widetilde{}', category: 'Formatting' },
            { name: 'Overleftarrow', command: '\\overleftarrow{}', category: 'Formatting' },
            { name: 'Overrightarrow', command: '\\overrightarrow{}', category: 'Formatting' },
            { name: 'Overleftrightarrow', command: '\\overleftrightarrow{}', category: 'Formatting' },
        ];

        return [...defaultSnippets, ...this.plugin.settings.customSnippets];
    }

    private groupSnippetsByCategory(snippets: LatexSnippet[]): Record<string, LatexSnippet[]> {
        return snippets.reduce((acc, snippet) => {
            const category = snippet.category || 'Other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(snippet);
            return acc;
        }, {} as Record<string, LatexSnippet[]>);
    }

    private filterSnippets(searchTerm: string) {
        const snippetItems = this.containerEl.querySelectorAll('.snippet-item');
        
        snippetItems.forEach(item => {
            const name = item.getAttribute('data-name') || '';
            const command = item.getAttribute('data-command') || '';
            
            if (name.includes(searchTerm) || command.includes(searchTerm)) {
                item.removeClass('is-hidden');
                item.addClass('is-visible');
            } else {
                item.removeClass('is-visible');
                item.addClass('is-hidden');
            }
        });

        // Hide empty categories
        const categories = this.containerEl.querySelectorAll('.snippet-category');
        categories.forEach(category => {
            const visibleItems = category.querySelectorAll('.snippet-item.is-visible, .snippet-item:not(.is-hidden)');
            
            if (visibleItems.length === 0) {
                category.removeClass('is-visible');
                category.addClass('is-hidden');
            } else {
                category.removeClass('is-hidden');
                category.addClass('is-visible');
            }
        });
    }

    private async insertSnippet(command: string) {
        console.log('Attempting to insert snippet:', command); // Debug log
        
        // Try multiple methods to get the active editor
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        if (!activeView) {
            console.log('No active MarkdownView found'); // Debug log
            // Try to get any markdown view
            const markdownViews = this.app.workspace.getLeavesOfType('markdown');
            if (markdownViews.length > 0) {
                const leaf = markdownViews[0];
                await this.app.workspace.setActiveLeaf(leaf);
                const view = leaf.view as MarkdownView;
                if (view && view.editor) {
                    this.performInsertion(view.editor, command);
                    return;
                }
            }
            
            // Show a notice if no editor is available
            new Notice('Please open a markdown note to insert LaTeX snippets');
            return;
        }

        const editor = activeView.editor;
        if (!editor) {
            console.log('No editor found in active view'); // Debug log
            new Notice('No editor available');
            return;
        }

        this.performInsertion(editor, command);
    }

    private performInsertion(editor: Editor, command: string) {
        console.log('Performing insertion:', command); // Debug log
        
        try {
            const cursor = editor.getCursor();
            console.log('Current cursor position:', cursor); // Debug log
            
            // Insert the command at cursor position
            editor.replaceRange(command, cursor);
            
            // Handle cursor positioning for commands with {}
            if (command.includes('{}')) {
                const insertedText = command;
                const firstBraceIndex = insertedText.indexOf('{}');
                
                if (firstBraceIndex !== -1) {
                    // Position cursor inside the first set of braces
                    const newCursor = {
                        line: cursor.line,
                        ch: cursor.ch + firstBraceIndex + 1
                    };
                    editor.setCursor(newCursor);
                    console.log('Cursor positioned at:', newCursor); // Debug log
                }
            } else {
                // Position cursor at the end of the inserted text
                const newCursor = {
                    line: cursor.line,
                    ch: cursor.ch + command.length
                };
                editor.setCursor(newCursor);
                console.log('Cursor positioned at end:', newCursor); // Debug log
            }
            
            // Focus the editor
            editor.focus();
            
            // Show success notice
            new Notice(`Inserted: ${command}`);
            
        } catch (error) {
            console.error('Error inserting snippet:', error);
            new Notice('Error inserting snippet');
        }
    }

    async onClose() {
        // Nothing to clean up
    }
}