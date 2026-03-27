
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

            const changesSection = new OllamaItem(
                'Changes',
                vscode.TreeItemCollapsibleState.Collapsed // user can expand/collapse this
            );
            changesSection.contextValue = "changesSection";

            const stagedSection = new OllamaItem(
                'Staged',
                vscode.TreeItemCollapsibleState.Collapsed,
            );
            stagedSection.contextValue = "stagedSection";


            return [header, stagedSection, changesSection];
        }

        const git = await GitService.getInstance();
        if (element.label === "Staged") {
            if (!git) { return []; }
            const stagedFiles = await git.getStagedFiles();
            return stagedFiles.map(file => this.resolveFilePathAndIcon(git, file));

        }
        if (element.label === "Changes") {
            if (!git) { return []; }
            const files = await git?.getUnstagedFiles();
            console.log(files);
            return files.map(file => this.resolveFilePathAndIcon(git, file));

        }


        return [];
    }

    private resolveFilePathAndIcon(git: GitService, file: string): OllamaItem {

        const segments = file.split("/");
        const fileName = segments[segments.length - 1]; // last segment
        const item = new OllamaItem(fileName, vscode.TreeItemCollapsibleState.None, { title: "Stage file", command: "ollama-auto-commit.stage", arguments: [file] });
        console.log("repoRoot:", git.getRepoRoot());
        item.description = file;
        item.resourceUri = vscode.Uri.file(
            path.join(git.getRepoRoot(), file)  // needs the absolute path
        );
        return item;
    }
}