#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const path_1 = require("path");
const CONFIG_FILE_NAME = 'melcp.config.json';
const EXAMPLE_FILE_NAME = 'melcp.config.example.json';
function loadBootstrap() {
    const mainModule = require('../dist/main.js');
    return mainModule.bootstrap;
}
function printUsage() {
    console.log('Usage: melcp <command>');
    console.log('');
    console.log('Commands:');
    console.log('  init   Create a starter config in current directory');
    console.log('  start  Start the app using melcp.config.json');
}
function getExampleConfigPath() {
    const candidates = [
        (0, path_1.resolve)(__dirname, `../${EXAMPLE_FILE_NAME}`),
        (0, path_1.resolve)(__dirname, `../../${EXAMPLE_FILE_NAME}`),
        (0, path_1.resolve)(process.cwd(), 'mcp-server', EXAMPLE_FILE_NAME),
    ];
    const found = candidates.find((candidate) => (0, fs_1.existsSync)(candidate));
    if (!found) {
        throw new Error(`Could not locate ${EXAMPLE_FILE_NAME} in package files.`);
    }
    return found;
}
function parseConfig(configPath) {
    try {
        const raw = (0, fs_1.readFileSync)(configPath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        throw new Error(`Invalid JSON in ${CONFIG_FILE_NAME}.`);
    }
}
function validateConfig(config) {
    if (!config.database?.url || !config.repo?.path) {
        throw new Error(`Invalid ${CONFIG_FILE_NAME}: missing required database.url or repo.path.`);
    }
}
function validateNewDevicePreflight(config, configPath) {
    const issues = [];
    const hints = [];
    const dbUrl = config.database?.url?.trim();
    if (!dbUrl) {
        issues.push('`database.url` is missing in melcp.config.json');
        hints.push('Set `database.url` to a reachable PostgreSQL connection string.');
    }
    const repoPath = config.repo?.path?.trim();
    if (!repoPath) {
        issues.push('`repo.path` is missing in melcp.config.json');
        hints.push('Set `repo.path` to your project root folder.');
    }
    else {
        const resolvedRepoPath = (0, path_1.resolve)(repoPath);
        if (!(0, fs_1.existsSync)(resolvedRepoPath)) {
            issues.push(`repo.path does not exist: ${resolvedRepoPath}`);
            hints.push('Fix `repo.path` so it points to a valid local folder.');
        }
    }
    const hasGoogleKey = Boolean(config.ai?.googleApiKey?.trim());
    const hasGroqKey = Boolean(config.ai?.groqApiKey?.trim());
    if (!hasGoogleKey && !hasGroqKey) {
        issues.push('Missing AI provider key in melcp.config.json (`ai.googleApiKey` or `ai.groqApiKey`).');
        hints.push('Set `ai.googleApiKey` (recommended) or `ai.groqApiKey` in melcp.config.json.');
    }
    if (issues.length === 0) {
        return;
    }
    const formattedIssues = issues.map((issue) => `  - ${issue}`).join('\n');
    const formattedHints = hints.map((hint) => `  - ${hint}`).join('\n');
    throw new Error([
        'Preflight failed. Please complete new-device setup:',
        '',
        'Checklist:',
        '  - PostgreSQL is installed and running',
        '  - melcp.config.json has valid database.url + repo.path',
        '  - melcp.config.json has ai.googleApiKey (or ai.groqApiKey)',
        '  - Start again with: melcp start',
        '',
        `Config checked: ${configPath}`,
        '',
        'Found issues:',
        formattedIssues,
        '',
        'How to fix:',
        formattedHints,
    ].join('\n'));
}
async function runInit() {
    const targetPath = (0, path_1.resolve)(process.cwd(), CONFIG_FILE_NAME);
    if ((0, fs_1.existsSync)(targetPath)) {
        console.log(`Config already exists at ${CONFIG_FILE_NAME}`);
        return;
    }
    const sourcePath = getExampleConfigPath();
    (0, fs_1.copyFileSync)(sourcePath, targetPath);
    const generatedApiKey = (0, crypto_1.randomUUID)();
    const generatedConfig = parseConfig(targetPath);
    generatedConfig.apiKey = generatedApiKey;
    (0, fs_1.writeFileSync)(targetPath, `${JSON.stringify(generatedConfig, null, 2)}\n`, 'utf-8');
    console.log('Config file created at melcp.config.json — fill it in and run start');
    console.log(`Your API key: ${generatedApiKey} — save this, it won't be shown again`);
}
async function runStart() {
    const configPath = (0, path_1.resolve)(process.cwd(), CONFIG_FILE_NAME);
    if (!(0, fs_1.existsSync)(configPath)) {
        throw new Error(`Missing ${CONFIG_FILE_NAME} in current directory. Run "melcp init" first.`);
    }
    const config = parseConfig(configPath);
    validateConfig(config);
    validateNewDevicePreflight(config, configPath);
    const port = Number(config.port ?? 3001);
    const host = config.host ?? '127.0.0.1';
    process.env.MELCP_CONFIG_PATH = configPath;
    process.env.PORT = String(port);
    process.env.HOST = host;
    if (config.ai?.googleApiKey?.trim()) {
        process.env.GOOGLE_API_KEY = config.ai.googleApiKey.trim();
    }
    if (config.ai?.groqApiKey?.trim()) {
        process.env.GROQ_API_KEY = config.ai.groqApiKey.trim();
    }
    const bootstrap = loadBootstrap();
    await bootstrap(port);
    console.log(`Running at http://localhost:${port}`);
}
async function main() {
    const command = process.argv[2];
    if (!command) {
        printUsage();
        return;
    }
    try {
        if (command === 'init') {
            await runInit();
            return;
        }
        if (command === 'start') {
            await runStart();
            return;
        }
        printUsage();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error.';
        console.error(message);
        process.exit(1);
    }
}
void main();
