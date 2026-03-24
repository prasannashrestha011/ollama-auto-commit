import * as vscode from 'vscode';


export default class ExtensionState {
    private readonly SELECTED_MODEL_KEY = 'selectedModel';  // instance property

    constructor(private context: vscode.ExtensionContext) { }

    getSelectedModel(): string {
        return this.context.globalState.get(this.SELECTED_MODEL_KEY, 'None');
    }

    async setSelectedModel(model: string) {
        await this.context.globalState.update(this.SELECTED_MODEL_KEY, model);
    }
}