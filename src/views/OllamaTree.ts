
import * as vscode from 'vscode';
import ExtensionState from '../state/state';

class OllamaItem extends vscode.TreeItem {
    constructor(label: string, command?: vscode.Command) {
        super(label);
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

    getChildren(): OllamaItem[] {
        const model = this.state.getSelectedModel();
        const header = new vscode.TreeItem(`Selected Model: ${model}`);
        header.contextValue = 'header';
        header.iconPath = new vscode.ThemeIcon('robot');
        return [
            header
        ];
    }
}