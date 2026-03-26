
import * as vscode from 'vscode';
import ExtensionState from '../state/state';
import { GitService } from '../services/gitServices';

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


    constructor(private state: ExtensionState) {

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

            const collapsible = new OllamaItem(
                'Changes',
                vscode.TreeItemCollapsibleState.Collapsed // user can expand/collapse this
            );
            collapsible.contextValue = "changesSection";


            return [header, collapsible];
        }
        if (element.label === "Changes") {
            const git = await GitService.getInstance();
            if (!git) { return []; }
            const files = git?.getUnstagedFiles();
            console.log(files);

        }
        return [];
    }
}