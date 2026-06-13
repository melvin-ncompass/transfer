# D2 Block Fix - Test Guide

## Problem Fixed

The error "No D2 block found in the language model response" was caused by:

1. **AI not wrapping D2 code in markdown code blocks** - The OutputFormatter expected `\`\`\`d2` blocks
2. **Missing explicit formatting instructions** - Prompts didn't clearly specify the required format
3. **No fallback handling** - When OutputFormatter failed, the whole process crashed

## Fixes Applied

### 1. Enhanced Prompt Instructions ✅
- Added explicit requirement: "MUST wrap D2 code in \`\`\`d2 code blocks"
- Updated all prompt types (detailed, semi, high-level)
- Made examples show proper markdown formatting

### 2. Smart Response Formatting ✅
- Auto-wrap raw D2 code in proper markdown blocks if missing
- Handle various response formats gracefully
- Fix incorrectly formatted code blocks

### 3. Fallback Error Handling ✅
- If OutputFormatter fails, create basic formatted output
- Continue processing instead of crashing
- Log warnings for debugging

## How to Test

### Quick Test
1. **Open a simple project** (any folder with a few code files)
2. **Run Swark 2.0**: Press `Ctrl+Shift+R`
3. **Choose**: Current Working Directory → High-Level → D2 Only
4. **Expected**: Should work without "No D2 block" error

### Detailed Test
1. Try all diagram types: High-Level, Semi, Detailed
2. Try all formats: D2 Only, Eraser Only, Both
3. Check generated files in `swark-output/` folder

## Expected Behavior

### ✅ Success Indicators
- No "No D2 block found" errors
- Files generated in `swark-output/` folder
- D2 content properly wrapped in \`\`\`d2 blocks
- Success message: "✅ [type] diagram generated successfully"

### 🔍 What to Check in Generated Files
```markdown
## Generated Content
**Model**: GPT-4o

\`\`\`d2
# Your D2 diagram here
database: {
    label: "Database"
    shape: cylinder
}
\`\`\`
```

## If Still Having Issues

1. **Check AI Model**: Ensure GitHub Copilot is working
2. **Try Different Model**: Change `swark2.languageModel` setting
3. **Check Console**: Look for any new error messages
4. **Reduce Scope**: Test with smaller project first

## Debug Mode

Add this to VS Code settings for verbose logging:
```json
{
    "swark2.debug": true
}
```

The fix should resolve the "No D2 block found" error by ensuring all AI responses are properly formatted!
