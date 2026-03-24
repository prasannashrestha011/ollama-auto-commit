import * as vscode from "vscode";
import { execSync } from "child_process";

export interface StagedInfo {
    diff: string;
    files: string[]
    additions: number;
    deletions: number;
}
export class GitService {
    private workSpaceRoot: string;
    constructor(workSpaceRoot: string) {
        this.workSpaceRoot = workSpaceRoot;
    }
    static fromWorkSpace(): GitService | null {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return null;
        }
        return new GitService(folders[0].uri.fsPath);
    }
    getStagedInfo(maxLength: number = 4000): StagedInfo {
        const diff = this.run("git diff --cached");
        const stat = this.run("git diff --cached --stat");

        const files = this.run("git diff --cached --name-only").split("\n").map(f => f.trim()).filter(Boolean);
        let additions = 0;
        let deletions = 0;
        const statMatch = stat.match(/(\d+) insertion|(\d+) deletion/g) || [];
        statMatch.forEach((m) => {
            const n = parseInt(m);
            if (m.includes("insertion")) { additions += n; }
            if (m.includes("deletion")) { deletions += n; }
        });

        // Truncate diff if needed
        const truncatedDiff =
            diff.length > maxLength
                ? diff.slice(0, maxLength) + "\n\n[diff truncated...]"
                : diff;

        return { diff: truncatedDiff, files, additions, deletions };


    }

    private run(cmd: string): string {

        return execSync(cmd, {
            cwd: this.workSpaceRoot,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    }
}