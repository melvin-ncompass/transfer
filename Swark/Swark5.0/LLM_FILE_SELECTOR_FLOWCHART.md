# 🔍 LLM-Guided File Selector Flowchart

## Overview
This flowchart shows how Swark 4.0's intelligent file selection system works using LLM guidance to optimize architecture analysis.

---

## 📊 Main Workflow: `selectFilesForAllLevels()`

```mermaid
flowchart TD
    Start([🚀 Start: selectFilesForAllLevels]) --> Input[📥 Input: Swark4Metadata]
    
    Input --> InitArray[🗃️ Initialize selections array]
    
    InitArray --> HighLevel[🔍 Select High-Level Files]
    HighLevel --> SemiDetailed[🔍 Select Semi-Detailed Files] 
    SemiDetailed --> Detailed[🔍 Select Detailed Files]
    
    Detailed --> Return[📤 Return: AnalysisLevelSelection[]]
    Return --> End([✅ End])

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class Start,End startEnd
    class Input,InitArray,HighLevel,SemiDetailed,Detailed,Return process
```

---

## 🎯 Individual Level Selection: `selectFilesForLevel()`

```mermaid
flowchart TD
    StartLevel([🎯 Start: selectFilesForLevel]) --> BuildPrompt[📝 Build LLM Prompt]
    
    BuildPrompt --> PromptDetails{📋 Prompt Contains:}
    PromptDetails --> RepoContext[🏗️ Repository Context]
    PromptDetails --> FileList[📄 File List Preview]
    PromptDetails --> LevelInstructions[📏 Level-Specific Instructions]
    PromptDetails --> SelectionCriteria[🎯 Selection Criteria]
    
    RepoContext --> SendLLM
    FileList --> SendLLM
    LevelInstructions --> SendLLM
    SelectionCriteria --> SendLLM[🤖 Send Request to LLM]
    
    SendLLM --> LLMSuccess{✅ LLM Success?}
    
    LLMSuccess -->|Yes| ParseResponse[🔍 Parse JSON Response]
    LLMSuccess -->|No| FallbackSelection[⚠️ Fallback Rule-Based Selection]
    
    ParseResponse --> ValidateFiles[✅ Validate Files Exist]
    ValidateFiles --> CalcTokens[🧮 Calculate Actual Tokens]
    CalcTokens --> BuildResult[📦 Build AnalysisLevelSelection]
    
    FallbackSelection --> SortByImportance[📊 Sort by Importance]
    SortByImportance --> ApplyTargetCount[🎯 Apply Target Count]
    ApplyTargetCount --> FallbackTokens[🧮 Calculate Fallback Tokens]
    FallbackTokens --> BuildFallbackResult[📦 Build Fallback Result]
    
    BuildResult --> ReturnLevel[📤 Return Selection]
    BuildFallbackResult --> ReturnLevel
    ReturnLevel --> EndLevel([✅ End])

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef llm fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef fallback fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class StartLevel,EndLevel startEnd
    class BuildPrompt,RepoContext,FileList,LevelInstructions,SelectionCriteria,ParseResponse,ValidateFiles,CalcTokens,BuildResult,ReturnLevel process
    class LLMSuccess,PromptDetails decision
    class SendLLM llm
    class FallbackSelection,SortByImportance,ApplyTargetCount,FallbackTokens,BuildFallbackResult fallback
```

---

## 🏗️ Prompt Building Process: `buildFileSelectionPrompt()`

```mermaid
flowchart LR
    StartPrompt([📝 Build Prompt]) --> GetInstructions[📏 Get Level Instructions]
    
    GetInstructions --> PrepareFiles[📄 Prepare File Summary]
    PrepareFiles --> LimitFiles[🔒 Limit to 100 Files]
    
    LimitFiles --> TemplateSection1[📋 Repository Context Section]
    TemplateSection1 --> TemplateSection2[🏗️ Repository Structure Section]
    TemplateSection2 --> TemplateSection3[📄 Available Files Section]
    TemplateSection3 --> TemplateSection4[📏 Analysis Level Section]
    TemplateSection4 --> TemplateSection5[🎯 Task Instructions Section]
    TemplateSection5 --> TemplateSection6[📤 Response Format Section]
    
    TemplateSection6 --> FinalPrompt[📜 Complete Prompt String]
    FinalPrompt --> EndPrompt([✅ Prompt Ready])

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef template fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class StartPrompt,EndPrompt startEnd
    class GetInstructions,PrepareFiles,LimitFiles,FinalPrompt process
    class TemplateSection1,TemplateSection2,TemplateSection3,TemplateSection4,TemplateSection5,TemplateSection6 template
```

---

## 📊 Analysis Level Targeting

```mermaid
graph TD
    LevelDecision{🎯 Analysis Level?} 
    
    LevelDecision -->|High-Level| HighConfig[🏔️ HIGH-LEVEL CONFIG<br/>📊 Target: 5-15 files<br/>🎯 Focus: Entry points & core<br/>📈 Priority: Architecture overview]
    
    LevelDecision -->|Semi-Detailed| SemiConfig[🏞️ SEMI-DETAILED CONFIG<br/>📊 Target: 15-30 files<br/>🎯 Focus: Core + key implementations<br/>📈 Priority: Component interactions]
    
    LevelDecision -->|Detailed| DetailedConfig[🔬 DETAILED CONFIG<br/>📊 Target: 30+ files<br/>🎯 Focus: Comprehensive coverage<br/>📈 Priority: Complete implementation]
    
    HighConfig --> Selection[🎯 File Selection]
    SemiConfig --> Selection
    DetailedConfig --> Selection

    %% Styling
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef config fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef result fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    
    class LevelDecision decision
    class HighConfig,SemiConfig,DetailedConfig config
    class Selection result
```

---

## 🔄 Response Parsing Flow: `parseFileSelectionResponse()`

```mermaid
flowchart TD
    StartParse([🔍 Parse Response]) --> TryJSON{📋 Try JSON Extraction}
    
    TryJSON -->|Success| ValidJSON[✅ Valid JSON Found]
    TryJSON -->|Fail| TryPattern[🔍 Try Pattern Matching]
    
    ValidJSON --> ValidateFiles[✅ Validate Files Exist]
    ValidateFiles --> ReturnValid[📤 Return Valid Selection]
    
    TryPattern --> PatternMatch{🎯 Files Found?}
    PatternMatch -->|Yes| FilterValid[🔍 Filter Valid Files]
    PatternMatch -->|No| EmptyResult[⚠️ Return Empty Selection]
    
    FilterValid --> ReturnPattern[📤 Return Pattern-Matched Files]
    
    ReturnValid --> EndParse([✅ End])
    ReturnPattern --> EndParse
    EmptyResult --> EndParse

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef warning fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    
    class StartParse,EndParse startEnd
    class ValidJSON,ValidateFiles,FilterValid process
    class TryJSON,PatternMatch decision
    class ReturnValid,ReturnPattern success
    class TryPattern,EmptyResult warning
```

---

## ⚠️ Fallback Selection Strategy: `fallbackFileSelection()`

```mermaid
flowchart TD
    StartFallback([⚠️ Fallback Selection]) --> SortImportance[📊 Sort by Importance]
    
    SortImportance --> ImportanceOrder[📋 Importance Order:<br/>1️⃣ Entry-point (4)<br/>2️⃣ Core (3)<br/>3️⃣ Utility (2)<br/>4️⃣ Dependency (1)]
    
    ImportanceOrder --> LevelCheck{🎯 Target Level?}
    
    LevelCheck -->|High-Level| HighFallback[🏔️ Select Entry-point + Core<br/>Target: 10 files]
    LevelCheck -->|Semi-Detailed| SemiFallback[🏞️ Select Non-dependency<br/>Target: 25 files]
    LevelCheck -->|Detailed| DetailedFallback[🔬 Select Non-dependency<br/>Target: 50 files]
    
    HighFallback --> CalcFallbackTokens[🧮 Calculate Tokens]
    SemiFallback --> CalcFallbackTokens
    DetailedFallback --> CalcFallbackTokens
    
    CalcFallbackTokens --> BuildFallbackResult[📦 Build Result with Reasoning]
    BuildFallbackResult --> EndFallback([✅ Fallback Complete])

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef fallback fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef info fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class StartFallback,EndFallback startEnd
    class SortImportance,CalcFallbackTokens,BuildFallbackResult process
    class LevelCheck decision
    class HighFallback,SemiFallback,DetailedFallback fallback
    class ImportanceOrder info
```

---

## 🎯 Key Features & Benefits

### 🤖 **LLM-Guided Intelligence**
- Uses AI to understand repository context and select optimal files
- Provides reasoning for file selection decisions
- Adapts to different project types and structures

### 📊 **Multi-Level Analysis**
- **High-Level**: Architectural overview with core components
- **Semi-Detailed**: Balanced view with key implementations  
- **Detailed**: Comprehensive coverage for deep analysis

### ⚡ **Robust Fallback System**
- Rule-based selection when LLM fails
- Importance-based file ranking
- Ensures analysis always completes successfully

### 🧮 **Token Optimization**
- Calculates actual token usage for selections
- Prevents context window overflow
- Provides efficiency metrics for analysis

### 🔍 **Smart Parsing**
- JSON response parsing with validation
- Pattern matching fallback for file extraction
- Robust error handling throughout the process

---

## 📈 **Performance Characteristics**

| Aspect | High-Level | Semi-Detailed | Detailed |
|--------|------------|---------------|----------|
| **File Count** | 5-15 files | 15-30 files | 30+ files |
| **Focus Area** | Architecture | Components | Implementation |
| **Token Usage** | Minimal | Moderate | Comprehensive |
| **Analysis Depth** | Overview | Balanced | Complete |

---

*This flowchart represents the sophisticated LLM-guided file selection system in Swark 4.0, designed to intelligently analyze repositories at multiple levels of detail while optimizing for token efficiency and analytical value.*
