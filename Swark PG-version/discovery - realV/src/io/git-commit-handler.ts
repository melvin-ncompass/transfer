import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitCommit {
    hash: string;
    shortHash: string;
    author: string;
    date: string;
    message: string;
    branch?: string;
}

export class GitCommitHandler {
    /**
     * Fetch all commits from the repository with detailed information
     */
    async fetchCommits(repositoryPath: string, limit: number = 50): Promise<GitCommit[]> {
        try {
            const gitCommand = `git -C "${repositoryPath}" log --pretty=format:"%H|%h|%an|%ad|%s" --date=short -n ${limit}`;
            const { stdout } = await execAsync(gitCommand);
            
            if (!stdout.trim()) {
                return [];
            }

            return stdout.trim().split('\n').map(line => {
                const [hash, shortHash, author, date, message] = line.split('|');
                return {
                    hash: hash.trim(),
                    shortHash: shortHash.trim(),
                    author: author.trim(),
                    date: date.trim(),
                    message: message.trim()
                };
            });
        } catch (error) {
            console.error('Error fetching commits:', error);
            throw new Error(`Failed to fetch commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get current branch information
     */
    async getCurrentBranch(repositoryPath: string): Promise<string> {
        try {
            const { stdout } = await execAsync(`git -C "${repositoryPath}" branch --show-current`);
            return stdout.trim() || 'HEAD';
        } catch (error) {
            console.warn('Could not determine current branch:', error);
            return 'HEAD';
        }
    }

    /**
     * Get commit information for specific hash
     */
    async getCommitInfo(repositoryPath: string, commitHash: string): Promise<GitCommit | null> {
        try {
            const gitCommand = `git -C "${repositoryPath}" log --pretty=format:"%H|%h|%an|%ad|%s" --date=short -n 1 ${commitHash}`;
            const { stdout } = await execAsync(gitCommand);
            
            if (!stdout.trim()) {
                return null;
            }

            const [hash, shortHash, author, date, message] = stdout.trim().split('|');
            return {
                hash: hash.trim(),
                shortHash: shortHash.trim(),
                author: author.trim(),
                date: date.trim(),
                message: message.trim()
            };
        } catch (error) {
            console.error('Error fetching commit info:', error);
            return null;
        }
    }

    /**
     * Present commit selection UI to user
     */
    async selectCommit(repositoryPath: string): Promise<GitCommit | null> {
        try {
            // Show progress while fetching commits
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Fetching repository commits...",
                cancellable: true
            }, async (progress, token) => {
                progress.report({ message: "Loading commit history..." });
                
                const commits = await this.fetchCommits(repositoryPath, 100);
                const currentBranch = await this.getCurrentBranch(repositoryPath);
                
                if (commits.length === 0) {
                    vscode.window.showWarningMessage('No commits found in repository');
                    return null;
                }

                progress.report({ message: "Preparing commit selection..." });

                // Create quick pick items
                const items: vscode.QuickPickItem[] = commits.map(commit => ({
                    label: `${commit.shortHash} - ${commit.message.substring(0, 60)}${commit.message.length > 60 ? '...' : ''}`,
                    description: `by ${commit.author} on ${commit.date}`,
                    detail: `Full hash: ${commit.hash}`,
                    picked: false
                }));

                // Add current HEAD option
                items.unshift({
                    label: `🎯 HEAD (Current) - Latest commit on ${currentBranch}`,
                    description: `Current branch: ${currentBranch}`,
                    detail: 'Use the latest commit without specifying a hash',
                    picked: true
                });

                // Show commit selection
                const selected = await vscode.window.showQuickPick(items, {
                    title: `Select Commit for Analysis (${commits.length} commits available)`,
                    placeHolder: 'Choose a commit to analyze...',
                    matchOnDescription: true,
                    matchOnDetail: true,
                    canPickMany: false,
                    ignoreFocusOut: true
                });

                if (!selected) {
                    return null;
                }

                // If HEAD selected, use latest commit
                if (selected.label.startsWith('🎯 HEAD')) {
                    return commits[0]; // First commit is the latest
                }

                // Find the selected commit
                const selectedHash = selected.detail?.replace('Full hash: ', '');
                return commits.find(commit => commit.hash === selectedHash) || null;
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    /**
     * Validate if a path is a git repository
     */
    async isGitRepository(repositoryPath: string): Promise<boolean> {
        try {
            await execAsync(`git -C "${repositoryPath}" rev-parse --git-dir`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get repository remote information
     */
    async getRemoteInfo(repositoryPath: string): Promise<{ name: string; url: string } | null> {
        try {
            const { stdout } = await execAsync(`git -C "${repositoryPath}" remote get-url origin`);
            const url = stdout.trim();
            
            // Extract repository name from URL
            const match = url.match(/([^\/]+)\.git$/) || url.match(/([^\/]+)$/);
            const name = match ? match[1] : 'Unknown Repository';
            
            return { name, url };
        } catch {
            return null;
        }
    }
}
