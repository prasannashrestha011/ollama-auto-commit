import * as vscode from 'vscode';

class OllamaItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly command?: vscode.Command
	) {
		super(label);
		this.tooltip = label;
	}
}

class OllamaTreeProvider implements vscode.TreeDataProvider<OllamaItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<OllamaItem | undefined | void> = new vscode.EventEmitter();
	readonly onDidChangeTreeData: vscode.Event<OllamaItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: OllamaItem): vscode.TreeItem {
		return element;
	}

	getChildren(): OllamaItem[] {
		return [
			new OllamaItem('Enter Name', {
				command: 'ollama-auto-commit.inputName',
				title: 'Enter Name'
			})
		];
	}
}

export function activate(context: vscode.ExtensionContext) {
	const provider = new OllamaTreeProvider();
	vscode.window.registerTreeDataProvider('ollamaCommitView', provider);

	// Command triggered by the tree item
	const disposable = vscode.commands.registerCommand('ollama-auto-commit.inputName', async () => {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter your name',
			placeHolder: 'John Doe'
		});
		if (name) {
			vscode.window.showInformationMessage(`Hello ${name} from Ollama!`);
		}
	});

	context.subscriptions.push(disposable);
}