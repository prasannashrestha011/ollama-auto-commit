
import * as vscode from 'vscode';
import ExtensionState from '../state/state';
import { GitService } from '../services/gitServices';
import path from 'path';

class OllamaItem extends vscode.TreeItem {
    constructor(label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
        , command?: vscode.Command) {
        super(label, collapsibleState);
        this.command = command;
    }
}

export default class OllamaTreeProvider implements vscode.TreeDataProvider<OllamaItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;


    constructor(private state: ExtensionState, context: vscode.ExtensionContext) {

        const watcher = vscode.workspace.createFileSystemWatcher("**/.git/index");
        watcher.onDidChange(() => this.refresh());
        watcher.onDidCreate(() => this.refresh());
        watcher.onDidDelete(() => this.refresh());
        context.subscriptions.push(watcher);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element: OllamaItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: OllamaItem): Promise<OllamaItem[]> {
        const model = this.state.getSelectedModel();
        const header = new vscode.TreeItem(`Selected Model: ${model}`);
        if (!element) {
            // Root level → header (leaf) + collapsible section
            const header = new OllamaItem(
                `Selected Model: ${model}`,
                vscode.TreeItemCollapsibleState.None // leaf node
            );


            /* stage section */
            const stagedSection = new OllamaItem(
                'Staged',
                vscode.TreeItemCollapsibleState.Collapsed,
            );
            stagedSection.contextValue = "stagedSection";


            /* Unstage section */
            const unstageSection = new OllamaItem(
                'Changes',
                vscode.TreeItemCollapsibleState.Collapsed // user can expand/collapse this
            );
            unstageSection.contextValue = "unstagedSection";


            return [header, stagedSection, unstageSection];
        }

        const git = await GitService.getInstance();
        if (element.label === "Staged") {
            if (!git) { return []; }
            const stagedFiles = await git.getStagedFiles();
            return stagedFiles.map(file => this.resolveFilePathAndIcon(git, file, "staged"));

        }
        if (element.label === "Changes") {
            if (!git) { return []; }
            const files = await git?.getUnstagedFiles();
            return files.map(file => this.resolveFilePathAndIcon(git, file, "unstaged"));

        }


        return [];
    }

    private resolveFilePathAndIcon(git: GitService, file: string, type: "staged" | "unstaged"): OllamaItem {
        const fileName = file.split("/")[file.length - 1];
        const item = new OllamaItem(fileName, vscode.TreeItemCollapsibleState.None, {
            title: "File Buffer",
            command: "ollama-auto-commit.filebuffer",
            arguments: [type, file]
        });
        item.contextValue = type === "staged" ? "stagedItem" : "unstagedItem";
        item.description = file;
        item.resourceUri = vscode.Uri.file(path.join(git.getRepoRoot(), file));
        return item;
    }
}