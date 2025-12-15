// import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { LatexSnippetsView, VIEW_TYPE_LATEX_SNIPPETS } from './latex-snippets-view';

interface LatexSnippetsSettings {
    customSnippets: LatexSnippet[];
}

export interface LatexSnippet {
    name: string;
    command: string;
    description?: string;
    category?: string;
    isCustom?: boolean;
}

const DEFAULT_SETTINGS: LatexSnippetsSettings = {
    customSnippets: []
};

export default class LatexSnippetsPlugin extends Plugin {
    settings: LatexSnippetsSettings;

    async onload() {
        await this.loadSettings();

        // Register the view
        this.registerView(
            VIEW_TYPE_LATEX_SNIPPETS,
            (leaf) => new LatexSnippetsView(leaf, this)
        );

        // Add ribbon icon to activate view
        this.addRibbonIcon('sigma', 'LaTeX Snippets', () => {
            this.activateView();
        });

        // Add command to open sidebar
        this.addCommand({
            id: 'open-sidebar',
            name: 'Open Sidebar',
            callback: () => {
                this.activateView();
            }
        });

        // Add settings tab
        this.addSettingTab(new LatexSnippetsSettingTab(this.app, this));
    }

    onunload() {
        // this.app.workspace.detachLeavesOfType(VIEW_TYPE_LATEX_SNIPPETS);
        // Don't detach leaves - let users manage their own workspace
        // Only clean up resources and unregister the view type
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_LATEX_SNIPPETS);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            await leaf?.setViewState({ type: VIEW_TYPE_LATEX_SNIPPETS, active: true });
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class LatexSnippetsSettingTab extends PluginSettingTab {
    plugin: LatexSnippetsPlugin;

    constructor(app: App, plugin: LatexSnippetsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        new Setting(containerEl)
            .setName('LaTeX Snippets Settings')
            .setHeading();


        new Setting(containerEl)
            .setName('Custom Snippets')
            .setDesc('Add your own custom LaTeX snippets')
            .addButton(button => {
                button
                    .setButtonText('Add Snippet')
                    .onClick(() => {
                        this.plugin.settings.customSnippets.push({
                            name: 'New Snippet',
                            command: '\\command',
                            description: 'Description',
                            category: 'Custom'
                        });
                        this.plugin.saveSettings();
                        this.display();
                    });
            });

        this.plugin.settings.customSnippets.forEach((snippet, index) => {
            new Setting(containerEl)
                .addText(text => {
                    text
                        .setPlaceholder('Snippet name')
                        .setValue(snippet.name)
                        .onChange(async (value) => {
                            this.plugin.settings.customSnippets[index].name = value;
                            await this.plugin.saveSettings();
                        });
                })
                .addText(text => {
                    text
                        .setPlaceholder('LaTeX command')
                        .setValue(snippet.command)
                        .onChange(async (value) => {
                            this.plugin.settings.customSnippets[index].command = value;
                            await this.plugin.saveSettings();
                        });
                })
                .addButton(button => {
                    button
                        .setButtonText('Remove')
                        .setWarning()
                        .onClick(async () => {
                            this.plugin.settings.customSnippets.splice(index, 1);
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });
        });
    }
}