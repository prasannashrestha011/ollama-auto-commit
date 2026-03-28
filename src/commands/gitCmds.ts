import { commands, Uri, Disposable, window } from 'vscode';
import { GitService } from '../services/gitServices';
import path from 'path';
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
            }),
            commands.registerCommand("ollama-auto-commit.filebuffer", async (fileType: string, filePath: string) => {

                if (!gitService) { return; }

                const absolutePath = path.join(gitService.getRepoRoot(), filePath);
                const isStagedItem = fileType === "staged";
                const gitUri = (ref: string) => Uri.from({
                    scheme: "git",
                    path: absolutePath,
                    // VS Code's git file system provider expects an absolute fs path here.
                    query: JSON.stringify({ path: absolutePath, ref })
                });
                if (isStagedItem) {
                    try {
                        await commands.executeCommand(
                            "vscode.open",
                            gitUri(""),
                        );
                    } catch (err) {
                        window.showWarningMessage(`Could not open staged version: ${filePath} is not currently staged.`);
                    }

                } else {
                    try {
                        await commands.executeCommand("vscode.diff",
                            gitUri("HEAD"),
                            Uri.file(absolutePath),
                            `${filePath} (unstaged)`
                        );
                    } catch {
                        await commands.executeCommand("vscode.open", Uri.file(absolutePath));
                    }
                }



            })
        ];
    }
}