import { window, workspace } from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import { StagedInfo } from "../types/git";
import path from 'path';

import fs from "fs";
const execAsync = promisify(exec);

export class GitService {
    private repoRoot: string;
    private static instance: GitService | null = null;

    private constructor(repoRoot: string) {
        this.repoRoot = repoRoot;
    }

    static async getInstance(): Promise<GitService | null> {
        if (GitService.instance) {
            return GitService.instance;
        }
        const root = await GitService.getRepoRoot();
        if (!root) {
            window.showErrorMessage("No git repository found");
            return null;
        }
        GitService.instance = new GitService(root);
        return GitService.instance;
    }

    // Resolves the repo root from the active editor or workspace folder
    private static async getRepoRoot(): Promise<string | null> {
        const activeFile = window.activeTextEditor?.document.uri;
        const cwd = activeFile
            ? workspace.getWorkspaceFolder(activeFile)?.uri.fsPath
            : workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!cwd) { return null; }

        try {
            const { stdout } = await execAsync("git rev-parse --show-toplevel", { cwd });
            return stdout.trim();
        } catch {
            return null;
        }
    }

    async getStagedFiles(): Promise<string[]> {
        const { stdout } = await execAsync("git diff --cached --name-only", {
            cwd: this.repoRoot,
        });
        return stdout.trim().split("\n").filter(Boolean);
    }

    async getUnstagedFiles(): Promise<string[]> {
        const { stdout } = await execAsync("git diff --name-only", {
            cwd: this.repoRoot,
        });
        return stdout.trim().split("\n").filter(Boolean);
    }

    async getStagedInfo(maxLength: number = 4000): Promise<StagedInfo> {
        const { stdout: rawDiff } = await execAsync("git diff --cached", {
            cwd: this.repoRoot,
        });
        const { additions, deletions } = this.parseDiff(rawDiff);
        const files = await this.getStagedFiles();
        const diff = rawDiff.length > maxLength
            ? rawDiff.slice(0, maxLength) + "\n\n[diff truncated...]"
            : rawDiff;
        return { additions, deletions, diff, files };
    }

    async stageFile(filePath: string) {
        const { stdout } = await execAsync(`git add ${filePath}`, { cwd: this.repoRoot });
    }
    async unstageFile(filePath: string): Promise<void> {
        await execAsync(`git restore --staged "${filePath}"`, { cwd: this.repoRoot });
    }

    async getStagedFileBuffer(filePath: string): Promise<string> {
        const { stdout } = await execAsync(
            `git show :${filePath}`,  // colon prefix reads from index (staged)
            { cwd: this.repoRoot }
        );
        return stdout;
    }

    async getUnstagedFileBuffer(filePath: string): Promise<string> {
        const { stdout } = await execAsync(`git diff ${filePath}`, { cwd: this.repoRoot });
        return stdout;
    }


    parseDiff(diff: string): { additions: number; deletions: number } {
        let additions = 0;
        let deletions = 0;
        for (const line of diff.split("\n")) {
            if (line.startsWith("+") && !line.startsWith("+++")) { additions++; }
            else if (line.startsWith("-") && !line.startsWith("---")) { deletions++; }
        }
        return { additions, deletions };
    }

    // Expose root for callers that still need it (e.g. running other git commands)
    getRepoRoot(): string {
        return this.repoRoot;
    }
}