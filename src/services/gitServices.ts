import { GitApi, GitExtension, Repository, StagedInfo } from "../types/git";
import { window, workspace, extensions } from "vscode";

export class GitService {
    private repo: Repository;
    private gitExtension: GitExtension;
    constructor(repo: Repository, gitExtension: GitExtension) {
        this.repo = repo;
        this.gitExtension = gitExtension;
    }

    static fromActiveEditor(): GitService | null {
        const ext = extensions.getExtension<GitExtension>("vscode.git");
        if (!ext?.isActive) {
            window.showErrorMessage("Git extension is not active, please install or activate it");
            return null;
        }

        const git = ext.exports.getApi(1);
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

    parseDiff(diff: string): { additions: number, deletions: number } {
        let additions = 0;
        let deletions = 0;

        for (const line of diff.split("\n")) {
            if (line.startsWith("+") && !line.startsWith("+++")) { additions++; }
            else if (line.startsWith("-") && !line.startsWith("---")) { deletions--; }
        }
        return { additions, deletions };
    }

}