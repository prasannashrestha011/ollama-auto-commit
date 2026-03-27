import { commands, Disposable } from 'vscode';
import { GitService } from '../services/gitServices';
export class GitCmds {
    static async registerCommands(): Promise<Disposable[]> {
        const gitService = await GitService.getInstance();

        return [
            commands.registerCommand("ollama-auto-commit.stage", async (filePath: string) => {
                if (!gitService) { return; };
                await gitService.stageFile(filePath);
            }),
        ];
    }
}