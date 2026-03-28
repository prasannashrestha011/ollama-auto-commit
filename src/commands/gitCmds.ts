import { commands, Disposable } from 'vscode';
import { GitService } from '../services/gitServices';
export class GitCmds {
    static async registerCommands(): Promise<Disposable[]> {
        const gitService = await GitService.getInstance();

        return [
            commands.registerCommand("ollama-auto-commit.stage", async (filePath: any) => {
                if (!gitService) { return; };
                await gitService.stageFile(filePath.description);
            }),
            commands.registerCommand("ollama-auto-commit.unstage", async (filePath: any) => {
                if (!gitService) { return; }
                console.log("RECEIEVED file path", filePath);
                await gitService.unstageFile(filePath.description);
            })
        ];
    }
}