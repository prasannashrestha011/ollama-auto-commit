import * as vscode from 'vscode';
import { GitService } from './services/gitServices';
import OllamaTreeProvider from './views/OllamaTree';
import OllamaCmds from './commands/ollamaCmds';
import ExtensionState from './state/state';
import { GitCmds } from './commands/gitCmds';


export async function activate(context: vscode.ExtensionContext) {
	const state = new ExtensionState(context);
	const treeProvider = new OllamaTreeProvider(state, context);
	const ollamaCmds = new OllamaCmds(state, treeProvider);

	vscode.window.registerTreeDataProvider('ollamaCommitView', treeProvider);
	context.subscriptions.push(...ollamaCmds.registerCommands());
	context.subscriptions.push(...await GitCmds.registerCommands());
}