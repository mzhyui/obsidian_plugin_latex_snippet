# Obsidian LaTeX Snippets Plugin

This is a LaTeX snippets plugin for Obsidian (https://obsidian.md) that provides a convenient sidebar view for inserting LaTeX mathematical symbols and expressions.

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.

This plugin enhances your mathematical writing workflow in Obsidian by providing:
- A dedicated sidebar view with categorized LaTeX snippets (e.g., `\otimes`, `\in`, `\sum`, `\alpha`)
- Quick insertion of mathematical symbols with a single click
- Search functionality to quickly find specific LaTeX commands
- Organized categories including Greek letters, operators, relations, arrows, and more
- Support for both inline and display math environments

## Features

- **Sidebar Panel**: Browse and insert LaTeX snippets from an organized sidebar
- **Categories**: Symbols organized by type (Greek letters, binary operators, relations, etc.)
- **Quick Search**: Find LaTeX commands instantly with built-in search
- **One-Click Insert**: Insert symbols directly into your active note at cursor position
- **Customizable**: Add your own frequently used LaTeX snippets

## Usage

1. **Enable the plugin** in Obsidian's Community Plugins settings
2. **Open the sidebar** by clicking the LaTeX icon in the ribbon or using the command palette
3. **Browse categories** or use the search bar to find specific symbols
4. **Click any snippet** to insert it at your cursor position
5. **Use in math blocks** - the plugin works with both `$inline$` and `$$display$$` math environments

### Available Categories

- **Greek Letters**: `\alpha`, `\beta`, `\gamma`, `\delta`, etc.
- **Binary Operators**: `\otimes`, `\oplus`, `\cup`, `\cap`, etc.
- **Relations**: `\in`, `\subset`, `\leq`, `\geq`, etc.
- **Arrows**: `\rightarrow`, `\leftarrow`, `\Rightarrow`, etc.
- **Delimiters**: `\langle`, `\rangle`, `\lceil`, `\rfloor`, etc.
- **Functions**: `\sin`, `\cos`, `\log`, `\lim`, etc.
- **Symbols**: `\infty`, `\partial`, `\nabla`, `\forall`, etc.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/latex-snippets/`.
