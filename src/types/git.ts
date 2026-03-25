import { Uri } from "vscode";
enum Status {
    INDEX_MODIFIED = 0,
    INDEX_ADDED = 1,
    INDEX_DELETED = 2,
    INDEX_RENAMED = 6,
    INDEX_COPIED = 7,

    MODIFIED = 5,
    DELETED = 6,
    UNTRACKED = 7,
    IGNORED = 8,
}
export interface StagedInfo {
    diff: string;
    files: string[];
    additions: number;
    deletions: number;
}

export interface GitExtension {
    getApi(version: 1): GitApi;
}
export interface GitApi {
    repositories: Repository[]
}
export interface Repository {
    rootUri: Uri;
    state: RepositoryState;
    diff(cached: boolean): Promise<string>
}
interface RepositoryState {
    indexChanges: Change[]
}

interface Change {
    uri: Uri;
    status: Status;
    originalUri?: Uri;
    renameUri?: Uri;
}

