export type CommandOption = {
    size: number;
    isAlphabet: boolean;
    isNumber: boolean;
    isMark: boolean;
    debug: boolean;
    key: string;
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

export const CommandIndex_CMD_NAME = 0;
export const CommandIndex_NOTE_NAME = 1;
export const CommandIndex_ENCRYPT_KEY = 1;
export const CommandIndex_PUT_PASSWORD = 2;
