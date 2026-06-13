import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
    timestamp: Date;
}

export class GitUtils {
    /**
     * Get the git repository path for the given folder
     */
    private static async getGitRepoPath(folderPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync("git rev-parse --show-toplevel", {
                cwd: folderPath
            });
            return stdout.trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if the given folder is in a git repository
     */
    public static async isGitRepository(folderPath: string): Promise<boolean> {
        const repoPath = await this.getGitRepoPath(folderPath);
        return repoPath !== null;
    }

    /**
     * Get recent commits from the git repository
     */
    public static async getRecentCommits(folderPath: string, limit: number = 20): Promise<GitCommit[]> {
        try {
            const gitFormat = '--pretty=format:"%H|%h|%an|%ad|%s"';
            const { stdout } = await execAsync(
                `git log --date=iso ${gitFormat} -${limit}`,
                { cwd: folderPath }
            );

            const commits: GitCommit[] = [];
            const lines = stdout.trim().split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    const cleanLine = line.replace(/^"|"$/g, ''); // Remove surrounding quotes
                    const parts = cleanLine.split('|');
                    
                    if (parts.length >= 5) {
                        const [hash, shortHash, author, dateStr, ...messageParts] = parts;
                        const message = messageParts.join('|'); // Rejoin in case message contained |
                        
                        commits.push({
                            hash: hash.trim(),
                            shortHash: shortHash.trim(),
                            author: author.trim(),
                            date: dateStr.trim(),
                            message: message.trim(),
                            timestamp: new Date(dateStr.trim())
                        });
                    }
                }
            }

            return commits;
        } catch (error) {
            console.error("Error getting git commits:", error);
            return [];
        }
    }

    /**
     * Get the current commit hash
     */
    public static async getCurrentCommit(folderPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync("git rev-parse HEAD", {
                cwd: folderPath
            });
            return stdout.trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Checkout to a specific commit
     */
    public static async checkoutCommit(folderPath: string, commitHash: string): Promise<boolean> {
        try {
            await execAsync(`git checkout ${commitHash}`, {
                cwd: folderPath
            });
            return true;
        } catch (error) {
            console.error("Error checking out commit:", error);
            return false;
        }
    }

    /**
     * Get the current branch name
     */
    public static async getCurrentBranch(folderPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync("git branch --show-current", {
                cwd: folderPath
            });
            return stdout.trim() || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if there are uncommitted changes
     */
    public static async hasUncommittedChanges(folderPath: string): Promise<boolean> {
        try {
            const { stdout } = await execAsync("git status --porcelain", {
                cwd: folderPath
            });
            return stdout.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Format commit information for display in quick pick
     */
    public static formatCommitForQuickPick(commit: GitCommit): vscode.QuickPickItem {
        const timeAgo = this.getTimeAgo(commit.timestamp);
        const truncatedMessage = commit.message.length > 60 
            ? commit.message.substring(0, 60) + "..."
            : commit.message;

        return {
            label: `$(git-commit) ${commit.shortHash}`,
            description: truncatedMessage,
            detail: `${commit.author} • ${timeAgo}`,
            alwaysShow: true
        };
    }

    /**
     * Get human-readable time ago string
     */
    private static getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return "Just now";
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
        }

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
    }
}
