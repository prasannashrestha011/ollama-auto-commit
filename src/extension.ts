import * as vscode from 'vscode';
import { GitService } from './services/gitServices';
import OllamaTreeProvider from './views/OllamaTree';
import OllamaCmds from './commands/ollamaCmds';
import ExtensionState from './state/state';


export function activate(context: vscode.ExtensionContext) {
	const state = new ExtensionState(context);

	const testCmd = vscode.commands.registerCommand('ollama-auto-commit.testGit', async () => {
		const git = GitService.fromWorkSpace();
		if (!git) {
			vscode.window.showErrorMessage("no workspace found");
			return;
		}

		const info = git.getStagedInfo();
		console.log(info);
		console.log(info.diff);


	});


	const provider = new OllamaTreeProvider(state);
	const cmds = new OllamaCmds(state, provider);

	vscode.window.registerTreeDataProvider('ollamaCommitView', provider);
	context.subscriptions.push(...cmds.registerCommands());
	context.subscriptions.push(testCmd);
}