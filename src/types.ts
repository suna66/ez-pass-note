export type CommandOption = {
    size: number;
    isAlphabet: boolean;
    isNumber: boolean;
    isMark: boolean;
    debug: boolean;
    key: string;
    yes: boolean;
    directory: string;
    commandList: Array<string>;
};

export type MetaType = {
    key: string;
    value: string;
};

export type ProjectType = {
    name: string;
    size: number;
    isAlphabet: boolean;
    isNumber: boolean;
    isMark: boolean;
    currentPassword: string;
    history: Array<string>;
    meta?: Array<MetaType>;
};

export const CommandIndex_CMD_NAME = 0;
export const CommandIndex_PROJECT_NAME = 1;
export const CommandIndex_ENCRYPT_KEY = 1;
export const CommandIndex_PUT_PASSWORD = 2;
export const CommandIndex_META_ACTION = 1;
