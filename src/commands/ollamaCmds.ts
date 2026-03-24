import * as vscode from 'vscode';

import { OllamaClient } from '../services/ollamaService';
import ExtensionState from '../state/state';
import OllamaTreeProvider from '../views/OllamaTree';

export default class OllamaCmds {

    private client: OllamaClient;
    constructor(
        private state: ExtensionState,
        private treeProvider: OllamaTreeProvider
    ) {
        this.client = new OllamaClient();
    }

    registerCommands(): vscode.Disposable[] {
        return [
            vscode.commands.registerCommand('ollama-auto-commit.pickModel', this.pickModel.bind(this)),
        ];
    }
    private async pickModel(): Promise<void> {
        const models = await this.client.listModels();
        const names = models.map(m => m.name);
        const choice = await vscode.window.showQuickPick(
            names,
            { placeHolder: 'Select LLM model ' }
        );
        if (choice) {
            this.state.setSelectedModel(choice);
            this.treeProvider.refresh();
            vscode.window.showInformationMessage(`${choice} has been selected`);
        }
    }
}