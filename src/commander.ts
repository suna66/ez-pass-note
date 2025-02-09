import {
    getHomeDirectory,
    makeDir,
    createRandomString,
    copyClipboard,
    encryptText,
    decryptText,
} from "./functions";
import { CommandOption, NoteType, CommandIndex } from "./types";
import {
    loadNoteFile,
    hasSameNoteName,
    writeNoteFile,
    getNoteInfo,
    deleteNoteInfo,
} from "./note_file";

const VERSION = "1.0.0";
const help = `
version: ${VERSION}
epmemo {COMMAND} [OPTIONS]

COMMAND:
    new {name}                 create new password memo
    ls                         list managed memo
    get {name}                 get password and copy to clipboard(man/win)
    update {name}              update password
    history {name}             display history of password(past 10 items)
    delete {name}              delete memo
    help                       show help message


OPTIONS(new):
    -s/--size {value}             password length(integer value). default is 8.
    -a/--alphabet {true/false}    using alphabet or not for password. default is true.
    -n/--number {true/false}      using numbers or not for password. default is true.
    -m/--mark {true/false}        using mark or not for password. default is true.


OPTIONS(common)
    -v/--verbose                  verbose mode
`;

const DEF_ASCII = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEF_NUMBER = "0123456789";
const DEF_MARK = ".-=,:#&!?[]{}";

let DEBUG = true;
let memoList: Array<NoteType> = undefined;
const pmemoDir = ".ez-pmemo";
const pmemoFile = "pmemo.json";

type CommandFunctionType = {
    name: string;
    func: (cmd: CommandOption) => Promise<boolean>;
};
const commandFunctions: Map<string, CommandFunctionType> = new Map([
    [
        "new",
        {
            name: "new",
            func: createPasswordMemo,
        },
    ],
    [
        "ls",
        {
            name: "ls",
            func: listPasswordMemo,
        },
    ],
    [
        "get",
        {
            name: "get",
            func: getPasswordMemo,
        },
    ],
    [
        "update",
        {
            name: "update",
            func: updatePasswordMemo,
        },
    ],
    [
        "history",
        {
            name: "history",
            func: getHistoryPasswordMemo,
        },
    ],
    [
        "delete",
        {
            name: "delete",
            func: deletePasswordMemo,
        },
    ],
    [
        "help",
        {
            name: "help",
            func: showHelp,
        },
    ],
]);

async function createPasswordMemo(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- createPasswordMemo");
    const commandList = cmd.commandList;
    const name = commandList[CommandIndex.NOTE_NAME];
    if (
        cmd.isAlphabet == false &&
        cmd.isNumber == false &&
        cmd.isMark == false
    ) {
        console.error("all charactor is disabled. can't create password.");
        return false;
    }
    if (hasSameNoteName(name, memoList)) {
        console.error("%s is already exsist", name);
        return false;
    }
    const option: NoteType = {
        name: name,
        size: cmd.size,
        isAlphabet: cmd.isAlphabet,
        isNumber: cmd.isNumber,
        isMark: cmd.isMark,
        currentPassword: "",
        history: [],
    };

    const str = createPassword(option);
    option.currentPassword = str;
    option.history.push(str);

    memoList.push(option);
    if (DEBUG) console.log(memoList);
    if (!writeNote()) {
        console.error("error: save new memo information");
        return false;
    }

    return true;
}

async function listPasswordMemo(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- listPasswordMemo");
    for (let m of memoList) {
        console.log(m.name);
    }
    return true;
}

async function getPasswordMemo(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- getPasswordMemo");
    const commandList = cmd.commandList;
    const name = commandList[CommandIndex.NOTE_NAME];

    const m = getNoteInfo(name, memoList);
    if (m == undefined) {
        console.error("%s is not found", name);
        return false;
    }
    console.log(m.currentPassword);

    return true;
}

async function updatePasswordMemo(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- updatePasswordMemo");
    const commandList = cmd.commandList;
    const name = commandList[CommandIndex.NOTE_NAME];

    const m = getNoteInfo(name, memoList);
    if (m == undefined) {
        console.error("%s is not found", name);
        return false;
    }
    const str = createPassword(m);
    m.currentPassword = str;
    m.history.push(str);
    if (m.history.length > 10) {
        m.history.shift();
    }
    if (DEBUG) console.log(memoList);
    if (!writeNote()) {
        console.error("error: save new memo information");
        return false;
    }

    return true;
}

async function getHistoryPasswordMemo(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- getHistoryPasswordMemo");
    const commandList = cmd.commandList;
    const name = commandList[CommandIndex.NOTE_NAME];

    const m = getNoteInfo(name, memoList);
    if (m == undefined) {
        console.error("%s is not found", name);
        return false;
    }
    for (let history of m.history) {
        console.log(history);
    }
    return true;
}

async function deletePasswordMemo(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- deletePasswordMemo");
    const commandList = cmd.commandList;
    const name = commandList[CommandIndex.NOTE_NAME];

    memoList = deleteNoteInfo(name, memoList);
    if (DEBUG) console.log(memoList);
    if (!writeNote()) {
        console.error("error: save new memo information");
        return false;
    }
    return true;
}

async function showHelp(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- showHelp");
    console.log(help);
    return true;
}

function getNotePath(): string {
    const home = getHomeDirectory();
    return `${home}/${pmemoDir}`;
}

function getNoteFile(): string {
    const dir = getNotePath();
    return `${dir}/${pmemoFile}`;
}

function loadNote(): boolean {
    const dir = getNotePath();

    let res = makeDir(dir);
    if (!res) {
        console.error("error: create ez-pmemo directory");
        return false;
    }
    const memoFile = getNoteFile();
    const list = loadNoteFile(memoFile);
    if (list != undefined) {
        memoList = list;
    } else {
        memoList = [];
    }
    return true;
}

function writeNote(): boolean {
    const memoFile = getNoteFile();
    return writeNoteFile(memoFile, memoList);
}

function createPassword(option: NoteType): string {
    let alpha = DEF_ASCII;
    let numb = DEF_NUMBER;
    let mark = DEF_MARK;
    if (!option.isAlphabet) {
        alpha = undefined;
    }
    if (!option.isNumber) {
        numb = undefined;
    }
    if (!option.isMark) {
        mark = undefined;
    }

    return createRandomString(option.size, alpha, numb, mark);
}

export async function startCommand(cmdLine: CommandOption) {
    if (DEBUG) {
        console.log(cmdLine);
    }
    if (cmdLine.commandList.length == 0) {
        await showHelp(cmdLine);
        return;
    }
    const cmd = cmdLine.commandList[CommandIndex.CMD_NAME];
    if (!commandFunctions.has(cmd)) {
        await showHelp(cmdLine);
        return;
    }
    if (!loadNote()) {
        return;
    }

    if (DEBUG) console.log(commandFunctions.get(cmd));
    const result = await commandFunctions.get(cmd).func(cmdLine);
    if (!result) {
        console.error("command has error");
        return;
    }

    // const encKey = encryptText("hello world text", "testpass");
    // console.log(encKey);
    // const txt = decryptText(
    //     encKey.cipherText,
    //     "testpass",
    //     encKey.iv,
    //     encKey.salt
    // );

    // console.log(txt);

    // const str = createRandomString(12, DEF_ASCII, DEF_NUMBER, DEF_MARK);
    // console.log(str);
    // copyClipboard(str);
}
