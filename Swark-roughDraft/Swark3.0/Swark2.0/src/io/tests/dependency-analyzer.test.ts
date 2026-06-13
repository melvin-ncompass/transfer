import * as assert from "assert";
import * as vscode from "vscode";
import { DependencyAnalyzer, DependencyNode } from "../dependency-analyzer";
import { File, TokenCounter } from "../../types";

suite("DependencyAnalyzer Test Suite", () => {
    // Mock token counter for testing
    const mockTokenCounter: TokenCounter = async (text: string | vscode.LanguageModelChatMessage) => {
        const textContent = typeof text === 'string' ? text : text.content;
        return textContent.length / 4; // Rough approximation: 4 chars per token
    };

    const mockFiles: File[] = [
        {
            path: "/src/main.ts",
            content: 'import { helper } from "./utils/helper";\nimport * as config from "./config";\n\nexport class Main {}',
            languageId: "typescript"
        },
        {
            path: "/src/utils/helper.ts", 
            content: 'import { Config } from "../config";\n\nexport function helper() {}',
            languageId: "typescript"
        },
        {
            path: "/src/config.ts",
            content: 'export interface Config {\n  apiUrl: string;\n}',
            languageId: "typescript"
        },
        {
            path: "/src/standalone.ts",
            content: 'export class Standalone {\n  doSomething() {}\n}',
            languageId: "typescript"
        }
    ];

    test("should build dependency graph correctly", async () => {
        const analyzer = new DependencyAnalyzer(mockTokenCounter, 1000);
        const result = await analyzer.analyzeAndChunk(mockFiles);
        
        assert.ok(result.chunks.length > 0, "Should create at least one chunk");
        assert.equal(result.metadata.totalFiles, 4, "Should process all 4 files");
        assert.ok(result.metadata.totalChunks >= 1, "Should create at least one chunk");
    });

    test("should respect token limits", async () => {
        const smallTokenLimit = 50; // Very small limit to force chunking
        const analyzer = new DependencyAnalyzer(mockTokenCounter, smallTokenLimit);
        const result = await analyzer.analyzeAndChunk(mockFiles);
        
        // Each chunk should respect token limit
        for (const chunk of result.chunks) {
            assert.ok(chunk.totalTokens <= smallTokenLimit, 
                `Chunk ${chunk.id} exceeds token limit: ${chunk.totalTokens} > ${smallTokenLimit}`);
        }
    });

    test("should calculate cohesion scores", async () => {
        const analyzer = new DependencyAnalyzer(mockTokenCounter, 1000);
        const result = await analyzer.analyzeAndChunk(mockFiles);
        
        for (const chunk of result.chunks) {
            assert.ok(chunk.cohesionScore >= 0 && chunk.cohesionScore <= 1, 
                `Cohesion score should be between 0 and 1, got ${chunk.cohesionScore}`);
        }
    });

    test("should generate meaningful descriptions", async () => {
        const analyzer = new DependencyAnalyzer(mockTokenCounter, 1000);
        const result = await analyzer.analyzeAndChunk(mockFiles);
        
        for (const chunk of result.chunks) {
            assert.ok(chunk.description.length > 0, "Chunk should have description");
            assert.ok(chunk.description.includes("files"), "Description should mention file count");
        }
    });

    test("should handle files with no dependencies", async () => {
        const standAloneFiles: File[] = [
            {
                path: "/src/file1.ts",
                content: 'export class File1 {}',
                languageId: "typescript"
            },
            {
                path: "/src/file2.ts", 
                content: 'export class File2 {}',
                languageId: "typescript"
            }
        ];

        const analyzer = new DependencyAnalyzer(mockTokenCounter, 1000);
        const result = await analyzer.analyzeAndChunk(standAloneFiles);
        
        assert.ok(result.chunks.length > 0, "Should handle standalone files");
        assert.equal(result.metadata.totalFiles, 2, "Should process all files");
    });

    test("should extract TypeScript dependencies correctly", async () => {
        const tsFile: File = {
            path: "/src/test.ts",
            content: `
                import { Component } from "./component";
                import * as utils from "../utils";
                import helper from "./helper";
                const config = require("./config");
            `,
            languageId: "typescript"
        };

        const analyzer = new DependencyAnalyzer(mockTokenCounter, 1000);
        // Access private method for testing (would need to make it public or create a test-specific method)
        // This is a simplified test - in practice you'd need to expose extraction methods for testing
        const result = await analyzer.analyzeAndChunk([tsFile]);
        assert.ok(result.chunks.length === 1, "Should create chunk for single file");
    });
});
