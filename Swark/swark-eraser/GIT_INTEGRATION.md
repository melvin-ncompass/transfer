# Git Integration Feature

## Overview

The Swark Eraser extension now includes git integration that allows users to generate architecture diagrams for specific commits in their repository's history.

## How It Works

1. **Commit Selection**: When you run the extension in a git repository, it will first prompt you to select a commit
2. **Diagram Type Selection**: After selecting a commit, you can choose which type of diagram to generate
3. **Temporary Checkout**: The extension temporarily checks out the selected commit, generates the diagram, then restores your original branch
4. **Commit Information**: The generated diagrams include information about the selected commit

## Features

### Commit Selection Dialog
- Shows last 25 commits with commit hash, message, author, and relative time
- Option to use current working directory state
- Displays commit information in a user-friendly format

### Diagram Types
- **High-Level**: Overview diagram for stakeholders
- **Semi-Detailed**: Moderate detail showing modules and workflows  
- **Detailed**: Comprehensive technical diagram for developers
- **All 3 Types**: Generates all three diagram types in one file

### Safety Features
- Warns users about uncommitted changes before proceeding
- Automatically restores original branch after diagram generation
- Non-destructive - doesn't affect your working directory permanently

### Enhanced Output
- Commit information included in diagram metadata
- Git commit details in log files
- Clear indication of which commit was used for generation

## Usage

1. Open a folder that contains a git repository
2. Run "Swark Eraser: Create Architecture Diagram" command
3. Select a commit from the list (or use current state)
4. Choose your desired diagram type
5. Wait for generation and automatic restoration

## Example Workflow

```
1. User runs Swark command
2. Extension detects git repository
3. Shows commit selection dialog:
   ┌─────────────────────────────────────────────┐
   │ 🔄 a1b2c3d Fix user authentication bug     │
   │    John Doe • 2 hours ago                  │
   │ 🔄 x4y5z6a Add new payment gateway         │
   │    Jane Smith • 1 day ago                  │
   │ 🔄 m7n8o9p Refactor database layer         │
   │    Bob Wilson • 3 days ago                 │
   └─────────────────────────────────────────────┘
4. User selects commit
5. Shows diagram type selection
6. Generates diagram with commit information
7. Restores original branch automatically
```

## Benefits

- **Historical Analysis**: Understand how your architecture evolved over time
- **Documentation**: Generate diagrams for specific releases or milestones
- **Code Reviews**: Visualize architecture changes between commits
- **Debugging**: See architecture at the time when issues were introduced
- **Team Communication**: Share architectural state at specific points in development

## Technical Implementation

### Files Modified/Added
- `src/io/git-utils.ts` - Git operations and commit management
- `src/commands/create-architecture.ts` - Enhanced command with git integration
- `src/view/output-formatter.ts` - Updated to include commit information

### Dependencies
- Uses native git commands through Node.js `child_process`
- No additional npm dependencies required
- Works with any git repository

### Error Handling
- Graceful fallback for non-git repositories
- Proper error messages for git command failures
- Safe restoration of original state on errors
