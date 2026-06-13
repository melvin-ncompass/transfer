# Swark 2.0 Troubleshooting Guide

## Issue: "Failed to generate diagram" Errors

If you're seeing errors like "Failed to generate detailed diagram", "Failed to generate high diagram", or "Failed to generate semi diagram", here are the debugging steps:

### 1. Check VS Code Developer Console

1. Open VS Code Developer Tools: `Help > Toggle Developer Tools`
2. Go to the Console tab
3. Run the Swark 2.0 command again
4. Look for detailed error messages in the console

### 2. Common Issues and Solutions

#### A. GitHub Copilot Not Activated
**Error**: "Model not found" or "Language model unavailable"
**Solution**: 
- Ensure GitHub Copilot extension is installed and activated
- Sign in to GitHub Copilot if prompted
- Check: `Command Palette > GitHub Copilot: Sign In`

#### B. No Files Found
**Error**: "No files to analyze" or empty file list
**Solution**:
- Check the `swark2.fileExtensions` setting
- Verify the folder contains supported file types
- Check `swark2.excludePatterns` isn't excluding everything

#### C. Token Limit Exceeded
**Error**: "Token limit exceeded" or "Too many files"
**Solution**:
- Reduce `swark2.maxFiles` setting (try 100 or 50)
- Add more patterns to `swark2.excludePatterns`
- Choose a smaller subfolder to analyze

#### D. AI Model Response Issues
**Error**: "Empty response from AI model" or "No diagram found"
**Solution**:
- Try a different AI model in settings (`swark2.languageModel`)
- Regenerate the diagram (AI responses can vary)
- Try generating single format instead of both

### 3. Debug Steps

#### Step 1: Test with Simple Project
1. Create a simple test folder with a few Python/JavaScript files
2. Try generating a high-level diagram with D2 format only
3. If this works, the issue is with your specific project

#### Step 2: Check Settings
```json
{
    "swark2.maxFiles": 50,
    "swark2.defaultOutputFormat": "d2",
    "swark2.languageModel": "gpt-4o",
    "swark2.fileExtensions": ["py", "js", "ts", "java"],
    "swark2.excludePatterns": [
        "**/node_modules/**",
        "**/.*",
        "**/dist/**",
        "**/build/**"
    ]
}
```

#### Step 3: Test Individual Components
1. Try D2 format only first
2. Try high-level diagram only
3. If these work, try semi and detailed
4. Finally test both formats together

#### Step 4: Check File Access
1. Ensure VS Code has read access to the folder
2. Check if any files are locked or in use
3. Try with a fresh copy of the repository

### 4. Enable Detailed Logging

Add this to your VS Code settings for more verbose logging:
```json
{
    "swark2.debug": true
}
```

### 5. Manual Testing Process

1. **Open a simple project** (e.g., a basic Node.js or Python project)
2. **Press Ctrl+Shift+R**
3. **Select "Current Working Directory"** (skip git commit selection)
4. **Choose "High-Level"** diagram type
5. **Select "D2 Only"** format
6. **Wait and check for errors**

### 6. Check Network and Extensions

1. Ensure internet connection is stable (for AI model access)
2. Disable other extensions temporarily to check for conflicts
3. Restart VS Code and try again

### 7. Alternative Approach

If the main command fails, try this manual approach:
1. Use the original Swark-Terrastruct or Swark-eraser extensions
2. Generate diagrams separately for comparison
3. Check if the issue is with the combined approach

### 8. Report Issues

If none of the above work, please provide:
1. VS Code version
2. Error messages from Developer Console
3. Project type and size (number of files)
4. Your settings configuration
5. Whether GitHub Copilot is working for other tasks

### 9. Quick Fixes

#### Reset Extension Settings
```json
{
    "swark2.maxFiles": 100,
    "swark2.fileExtensions": ["py", "js", "ts"],
    "swark2.excludePatterns": ["**/node_modules/**", "**/.*"],
    "swark2.languageModel": "gpt-4o",
    "swark2.defaultOutputFormat": "d2"
}
```

#### Try Smaller Scope
- Select a subfolder instead of the entire repository
- Reduce file count by updating exclude patterns
- Test with a single file type first

#### Alternative Keybinding Test
If Ctrl+Shift+R doesn't work:
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Swark 2.0: Create Architecture Diagram"
3. Select and run the command

### 10. Success Indicators

When working correctly, you should see:
1. "Generating architecture diagrams for: ..." message
2. Progress notification "Creating architecture diagram..."
3. Information message "✅ [type] diagram generated successfully"
4. New files in `swark-output/` folder
5. Diagram automatically opens in VS Code

---

**Note**: The most common issues are related to GitHub Copilot setup and project file access. Start with those checks first.
