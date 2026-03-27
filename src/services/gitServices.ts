import { GitApi, GitExtension, Repository, StagedInfo } from "../types/git";
import { window, workspace, extensions } from "vscode";

export class GitService {
    public repo: Repository;
    private gitExtension: GitExtension;
    //singleton service provided to view and command
    private static instance: GitService | null = null;
    constructor(repo: Repository, gitExtension: GitExtension) {
        this.repo = repo;
        this.gitExtension = gitExtension;
    }
    static async getInstance(): Promise<GitService | null> {
        if (GitService.instance) {
            return GitService.instance;
        }
        // retry up to 3 times with delay — git ext may not be ready immediately
        for (let i = 0; i < 3; i++) {
            GitService.instance = await GitService.fromActiveEditor();
            if (GitService.instance) {
                return GitService.instance;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 1s, 2s, 3s
        }

        return GitService.instance;
    }

    static async fromActiveEditor(): Promise<GitService | null> {
        const ext = extensions.getExtension<GitExtension>("vscode.git");
        if (!ext) {
            window.showErrorMessage("Git extension is not installed");
            return null;
        }

        if (!ext.isActive) {
            await ext.activate();
        }

        // wait for exports to be available
        if (!ext.exports) {
            window.showErrorMessage("Git extension exports not available");
            return null;
        }


        const git = ext.exports.getAPI?.(1) ?? ext.exports.getApi?.(1);
        if (!git) {
            window.showErrorMessage("Git extension API not available");
            return null;
        }
        if (!git.repositories.length) {
            window.showErrorMessage("No git repositories found");
            return null;
        }
        const repo = GitService.resolveRepo(git);

        if (!repo) {
            window.showErrorMessage("Repository not found with current file buffer");
            return null;
        }
        return new GitService(repo, ext.exports);


    }
    private static resolveRepo(git: GitApi): Repository | null {
        const activeEditor = window.activeTextEditor;

        /*
         * returns repository of active Editor
        */
        if (activeEditor) {
            const fileUri = activeEditor.document.uri;
            const repoForFile = git.repositories.find(repo => fileUri.fsPath.startsWith(repo.rootUri.fsPath));
            if (repoForFile) { return repoForFile; }
        }

        const workSpaceEditor = activeEditor ?
            workspace.getWorkspaceFolder(activeEditor.document.uri) :
            workspace.workspaceFolders?.[0];
        if (workSpaceEditor) {
            const workSpaceUri = workSpaceEditor.uri;
            const repoForWorkSpace = git.repositories.find(repo => workSpaceUri.fsPath.startsWith(repo.rootUri.fsPath));
            if (repoForWorkSpace) { return repoForWorkSpace; }
        }
        if (git.repositories.length !== 0) {
            return git.repositories[0];
        }
        return null;

    }
    async getStagedInfo(maxLength: number = 4000): Promise<StagedInfo> {
        const rawDiff = await this.repo.diff(true);
        const { additions, deletions } = this.parseDiff(rawDiff);
        const files = this.repo.state.indexChanges.map(change => workspace.asRelativePath(change.uri));
        const truncateDiff = rawDiff.length > maxLength ? rawDiff.slice(0, maxLength) + "\n\n[diff truncated...]" : rawDiff;
        return { additions, deletions, diff: rawDiff, files };
    }

    getStagedFiles(): string[] {
        return this.repo.state.indexChanges.map(change => workspace.asRelativePath(change.uri));
    }

    getUnstagedFiles(): string[] {
        return this.repo.state.workingTreeChanges.map(change => workspace.asRelativePath(change.uri));
    }

    parseDiff(diff: string): { additions: number, deletions: number } {
        let additions = 0;
        let deletions = 0;

        for (const line of diff.split("\n")) {
            if (line.startsWith("+") && !line.startsWith("+++")) { additions++; }
            else if (line.startsWith("-") && !line.startsWith("---")) { deletions++; }
        }
        return { additions, deletions };
    }

}