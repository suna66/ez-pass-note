export type CommandOption = {
    size: number;
    isAlphabet: boolean;
    isNumber: boolean;
    isMark: boolean;
    debug: boolean;
    commandList: Array<string>;
};

export type NoteType = {
    name: string;
    size: number;
    isAlphabet: boolean;
    isNumber: boolean;
    isMark: boolean;
    currentPassword: string;
    history: Array<string>;
};

export enum CommandIndex {
    CMD_NAME = 0,
    NOTE_NAME = 1,
}
