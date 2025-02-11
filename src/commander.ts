import {
    getHomeDirectory,
    makeDir,
    createRandomString,
    copyClipboard,
    existPath,
} from "./functions";
import {
    CommandIndex_CMD_NAME,
    CommandIndex_ENCRYPT_KEY,
    CommandIndex_NOTE_NAME,
    CommandIndex_PUT_PASSWORD,
    CommandOption,
    NoteType,
} from "./types";
import {
    loadNoteFile,
    hasSameNoteName,
    writeNoteFile,
    getNoteInfo,
    deleteNoteInfo,
} from "./note_file";
import { keyInput } from "./input";

const VERSION = "1.0.0";
const help = `
version: ${VERSION}
epnote {COMMAND} [OPTIONS]

COMMAND:
    new {name}                 create new managed password name
    ls                         list managed password name
    get {name}                 get password and copy to clipboard(man/win)
    update {name}              update password
    history {name}             display history of password(past 10 items)
    delete {name}              delete password
    enc {key}                  encrypt password file
    put {name} {key}           put password made other way to this tool
    help                       show help message

OPTIONS(new):
    -s/--size {value}             password length(integer value). default is 8.
    -a/--alphabet {true/false}    using alphabet or not for password. default is true.
    -n/--number {true/false}      using numbers or not for password. default is true.
    -m/--mark {true/false}        using mark or not for password. default is true.

OPTIONS(common)
    -v/--verbose                  verbose mode
    -k/--secret_key {value}       secret key for encrypt/decrypt password file(required if password file is encrypted)
`;

const DEF_ALPHA = "abcdefghijklmnopqrstuvwxyz";
const DEF_NUMBER = "0123456789";
const DEF_MARK = ".-=,:#&!?[]{}";

let DEBUG = true;
let noteList: Array<NoteType> = undefined;
const pNoteDir = ".ez-pnote";
const pNoteFile = "p-note.json";
const pNoteKeyFile = "p-note.key";

type CommandFunctionType = {
    name: string;
    func: (cmd: CommandOption) => Promise<boolean>;
};
const commandFunctions: Map<string, CommandFunctionType> = new Map([
    [
        "new",
        {
            name: "new",
            func: createPasswordNote,
        },
    ],
    [
        "ls",
        {
            name: "ls",
            func: listPasswordNote,
        },
    ],
    [
        "get",
        {
            name: "get",
            func: getPasswordNote,
        },
    ],
    [
        "update",
        {
            name: "update",
            func: updatePasswordNote,
        },
    ],
    [
        "history",
        {
            name: "history",
            func: getHistoryPasswordNote,
        },
    ],
    [
        "delete",
        {
            name: "delete",
            func: deletePasswordNote,
        },
    ],
    [
        "enc",
        {
            name: "enc",
            func: encryptNote,
        },
    ],
    [
        "put",
        {
            name: "put",
            func: putPasswordNote,
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

async function createPasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- createPasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: new command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];
    if (
        cmd.isAlphabet == false &&
        cmd.isNumber == false &&
        cmd.isMark == false
    ) {
        console.error(
            "error: all character is disabled. can't create password."
        );
        return false;
    }
    if (hasSameNoteName(name, noteList)) {
        console.error("error: %s is already exist", name);
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

    noteList.push(option);
    if (DEBUG) console.log(noteList);
    if (!writeNote(cmd.key)) {
        console.error("error: save new Note information");
        return false;
    }
    console.log(str);
    copyClipboard(str);

    return true;
}

async function listPasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- listPasswordNote");
    for (let m of noteList) {
        console.log(m.name);
    }
    return true;
}

async function getPasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- getPasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: get command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    const m = getNoteInfo(name, noteList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    console.log(m.currentPassword);
    copyClipboard(m.currentPassword);

    return true;
}

async function updatePasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- updatePasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: update command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    console.log("update password: %s", name);
    const ok = await keyInput("Are you sure to update password? (Y/N) : ");
    if (ok != "Y" && ok != "y") {
        return true;
    }

    const m = getNoteInfo(name, noteList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    const str = createPassword(m);
    m.currentPassword = str;
    m.history.push(str);
    if (m.history.length > 10) {
        m.history.shift();
    }
    if (DEBUG) console.log(noteList);
    if (!writeNote(cmd.key)) {
        console.error("error: save new Note information");
        return false;
    }
    console.log(m.currentPassword);
    copyClipboard(m.currentPassword);

    return true;
}

async function getHistoryPasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- getHistoryPasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: history command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    const m = getNoteInfo(name, noteList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    for (let history of m.history) {
        console.log(history);
    }
    return true;
}

async function deletePasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- deletePasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: delete command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    console.log("delete note: %s", name);
    const ok = await keyInput("Are you sure to delete this password? (Y/N) : ");
    if (ok != "Y" && ok != "y") {
        return true;
    }

    noteList = deleteNoteInfo(name, noteList);
    if (DEBUG) console.log(noteList);
    if (!writeNote(cmd.key)) {
        console.error("error: save new information");
        return false;
    }
    console.log("deleted %s", name);
    return true;
}

async function encryptNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- encryptNote");

    if (cmd.commandList.length < 2) {
        console.error("error: enc command needs encrypt key");
        return false;
    }

    const encryptKey = cmd.commandList[CommandIndex_ENCRYPT_KEY];
    if (encryptKey == undefined || encryptKey.length == 0) {
        console.error("error: encrypt key is not set");
        return false;
    }

    console.log("encrypt key: %s", encryptKey);
    const ok = await keyInput("Are you sure to encrypt save file? (Y/N) : ");
    if (ok != "Y" && ok != "y") {
        return true;
    }

    if (!writeNote(encryptKey)) {
        console.error("error: save new information");
        return false;
    }
    console.log("save file is encrypted");
    return true;
}

async function putPasswordNote(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- putPasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 3) {
        console.error(
            "error: put command needs name and password you want to put"
        );
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];
    const pass = commandList[CommandIndex_PUT_PASSWORD];

    console.log("put password(%s) to %s", pass, name);
    const ok = await keyInput("Are you sure to put password? (Y/N) : ");
    if (ok != "Y" && ok != "y") {
        return true;
    }

    const m = getNoteInfo(name, noteList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    m.currentPassword = pass;
    m.history.push(pass);
    if (m.history.length > 10) {
        m.history.shift();
    }
    if (DEBUG) console.log(noteList);
    if (!writeNote(cmd.key)) {
        console.error("error: save new Note information");
        return false;
    }
    console.log(m.currentPassword);
    copyClipboard(m.currentPassword);

    return true;
}

async function showHelp(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- showHelp");
    console.log(help);
    return true;
}

function getNoteDir(): string {
    const home = getHomeDirectory();
    return `${home}/${pNoteDir}`;
}

function getNoteFilePath(): string {
    const dir = getNoteDir();
    return `${dir}/${pNoteFile}`;
}

function getNoteKeyFilePath(): string {
    const dir = getNoteDir();
    return `${dir}/${pNoteKeyFile}`;
}

function loadNote(key: string = undefined): boolean {
    const dir = getNoteDir();

    let res = makeDir(dir);
    if (!res) {
        console.error("error: create epnote directory");
        return false;
    }
    if (
        existPath(getNoteKeyFilePath()) &&
        (key == undefined || key.length == 0)
    ) {
        console.error(
            "error: note file is encrypted. please set key using --secret_key option"
        );
        return false;
    }
    const list = loadNoteFile(getNoteFilePath(), key, getNoteKeyFilePath());
    if (list == undefined) {
        console.error("error: load note file");
        return false;
    }
    noteList = list;

    return true;
}

function writeNote(key: string = undefined): boolean {
    return writeNoteFile(
        getNoteFilePath(),
        noteList,
        key,
        getNoteKeyFilePath()
    );
}

function createPassword(option: NoteType): string {
    let alpha = DEF_ALPHA;
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

export async function startCommand(cmdLine: CommandOption): Promise<number> {
    DEBUG = cmdLine.debug;
    if (DEBUG) {
        console.log(cmdLine);
    }
    if (cmdLine.commandList.length == 0) {
        await showHelp(cmdLine);
        return -1;
    }
    const cmd = cmdLine.commandList[CommandIndex_CMD_NAME];
    if (!commandFunctions.has(cmd)) {
        await showHelp(cmdLine);
        return -1;
    }
    if (cmd != "help") {
        if (!loadNote(cmdLine.key)) {
            return -1;
        }
    }

    if (DEBUG) console.log(commandFunctions.get(cmd));
    const result = await commandFunctions.get(cmd).func(cmdLine);
    if (!result) {
        return 1;
    }
    return 0;
}
