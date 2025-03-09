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
    CommandIndex_META_ACTION,
    CommandOption,
    ProjectType,
    MetaType,
} from "./types";
import {
    loadProjectFile,
    hasSameProjectName,
    writeProjectFile,
    getProjectInfo,
    deleteProjectInfo,
} from "./project_file";
import { keyInput } from "./input";

const VERSION = "1.0.0";
const help = `
version: ${VERSION}
epnote {COMMAND} [OPTIONS]

COMMAND:
    new {name}                                      create new projecgt name
    ls                                              list project name
    get {name}                                      get password and copy to clipboard(man/win)
    update {name}                                   update password
    history {name}                                  display history of password(past 10 items)
    delete {name}                                   delete project
    meta [add | del] {name} {meta key} {meta data}  insert meta informatioin to project(default: add)
    enc {key}                                       encrypt password file
    put {name} {key}                                put password made other way to this tool
    help                                            show help message

OPTIONS(new):
    -s/--size {value}             password length(integer value). default is 8.
    -a/--alphabet {true/false}    using alphabet or not for password. default is true.
    -n/--number {true/false}      using numbers or not for password. default is true.
    -m/--mark {true/false}        using mark or not for password. default is true.

OPTIONS(common)
    -v/--verbose                  verbose mode
    -k/--secret_key {value}       secret key for encrypt/decrypt password file(required if password file is encrypted)
    -d/--dirctory {path}          specified directory to save password managed file and key file.     
    -y/--yes                      automatically accept prompts
`;

const DEF_ALPHA = "abcdefghijklmnopqrstuvwxyz";
const DEF_NUMBER = "0123456789";
const DEF_MARK = ".-=,:#&!?[]{}";

let DEBUG = true;
let projectList: Array<ProjectType> = undefined;
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
            func: createPasswordProject,
        },
    ],
    [
        "ls",
        {
            name: "ls",
            func: listPasswordProject,
        },
    ],
    [
        "get",
        {
            name: "get",
            func: getPasswordProject,
        },
    ],
    [
        "update",
        {
            name: "update",
            func: updatePasswordProject,
        },
    ],
    [
        "history",
        {
            name: "history",
            func: getHistoryPasswordProject,
        },
    ],
    [
        "delete",
        {
            name: "delete",
            func: deletePasswordProject,
        },
    ],
    [
        "meta",
        {
            name: "meta",
            func: manageMeta,
        },
    ],
    [
        "enc",
        {
            name: "enc",
            func: encryptProject,
        },
    ],
    [
        "put",
        {
            name: "put",
            func: putPasswordProject,
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

async function createPasswordProject(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- createPasswordProject");
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
    if (hasSameProjectName(name, projectList)) {
        console.error("error: %s is already exist", name);
        return false;
    }
    const option: ProjectType = {
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

    projectList.push(option);
    if (DEBUG) console.log(projectList);
    if (!writeProjects(cmd.key, cmd.directory)) {
        console.error("error: save new Note information");
        return false;
    }
    console.log(str);
    await copyClipboard(str);

    return true;
}

async function listPasswordProject(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- listPasswordProject");
    for (let m of projectList) {
        console.log(m.name);
    }
    return true;
}

async function getPasswordProject(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- getPasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: get command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    const m = getProjectInfo(name, projectList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    if (DEBUG) console.log(m);
    console.log(m.currentPassword);
    if (m.meta != undefined) {
        for (var meta of m.meta) {
            console.log("- %s = %s", meta.key, meta.value);
        }
    }
    await copyClipboard(m.currentPassword);

    return true;
}

async function updatePasswordProject(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- updatePasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: update command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    if (!cmd.yes) {
        console.log("update password: %s", name);
        const ok = await keyInput("Are you sure to update password? (Y/N) : ");
        if (ok != "Y" && ok != "y") {
            return true;
        }
    }

    const m = getProjectInfo(name, projectList);
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
    if (DEBUG) console.log(projectList);
    if (!writeProjects(cmd.key, cmd.directory)) {
        console.error("error: save new Note information");
        return false;
    }
    console.log(m.currentPassword);
    await copyClipboard(m.currentPassword);

    return true;
}

async function getHistoryPasswordProject(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- getHistoryPasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: history command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    const m = getProjectInfo(name, projectList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    for (let history of m.history) {
        console.log(history);
    }
    return true;
}

async function deletePasswordProject(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- deletePasswordNote");
    const commandList = cmd.commandList;
    if (commandList.length < 2) {
        console.error("error: delete command needs name as an identifier");
        return false;
    }
    const name = commandList[CommandIndex_NOTE_NAME];

    if (!cmd.yes) {
        console.log("delete note: %s", name);
        const ok = await keyInput(
            "Are you sure to delete this password? (Y/N) : "
        );
        if (ok != "Y" && ok != "y") {
            return true;
        }
    }

    projectList = deleteProjectInfo(name, projectList);
    if (DEBUG) console.log(projectList);
    if (!writeProjects(cmd.key, cmd.directory)) {
        console.error("error: save new information");
        return false;
    }
    console.log("deleted %s", name);
    return true;
}

async function manageMeta(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- menageMeta");

    if (cmd.commandList.length < 3) {
        console.error("error: manage meta command doesn't have enough options");
        return false;
    }
    let actionType = "add";
    let nextIndex = CommandIndex_META_ACTION;
    const action = cmd.commandList[CommandIndex_META_ACTION];
    if (action == "del") {
        actionType = action;
        nextIndex++;
    } else if (action == "add") {
        nextIndex++;
    }
    const name = cmd.commandList[nextIndex++];
    const metaKey = cmd.commandList[nextIndex++];
    let metaValue = "";
    if (actionType == "add") {
        metaValue = cmd.commandList[nextIndex];
    }
    if (name == null || metaKey == null) {
        console.error("error: manage meta command doesn't have enough options");
        return false;
    }
    const m = getProjectInfo(name, projectList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    if (actionType == "del") {
        const metaList = m.meta;
        const newMetaList: Array<MetaType> = [];
        if (meta != undefined) {
            for (var meta of metaList) {
                if (meta.key != metaKey) {
                    newMetaList.push(meta);
                }
            }
        }
        m.meta = newMetaList;
    } else {
        let metaList = m.meta;
        if (metaList == undefined) {
            metaList = [];
        }
        const newMetaList: Array<MetaType> = [];
        for (var meta of metaList) {
            if (meta.key != metaKey) {
                if (meta.key != metaKey) {
                    newMetaList.push(meta);
                }
            }
        }
        newMetaList.push({ key: metaKey, value: metaValue });
        m.meta = newMetaList;
    }
    if (DEBUG) console.log(projectList);
    if (!writeProjects(cmd.key, cmd.directory)) {
        console.error("error: save new information");
        return false;
    }
    console.log("managed meta %s", name);
    return true;
}

async function encryptProject(cmd: CommandOption): Promise<boolean> {
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

    if (!cmd.yes) {
        console.log("encrypt key: %s", encryptKey);
        const ok = await keyInput(
            "Are you sure to encrypt save file? (Y/N) : "
        );
        if (ok != "Y" && ok != "y") {
            return true;
        }
    }

    if (!writeProjects(encryptKey, cmd.directory)) {
        console.error("error: save new information");
        return false;
    }
    console.log("save file is encrypted");
    return true;
}

async function putPasswordProject(cmd: CommandOption): Promise<boolean> {
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

    if (!cmd.yes) {
        console.log("put password(%s) to %s", pass, name);
        const ok = await keyInput("Are you sure to put password? (Y/N) : ");
        if (ok != "Y" && ok != "y") {
            return true;
        }
    }

    const m = getProjectInfo(name, projectList);
    if (m == undefined) {
        console.error("error: %s is not found", name);
        return false;
    }
    m.currentPassword = pass;
    m.history.push(pass);
    if (m.history.length > 10) {
        m.history.shift();
    }
    if (DEBUG) console.log(projectList);
    if (!writeProjects(cmd.key, cmd.directory)) {
        console.error("error: save new Note information");
        return false;
    }
    console.log(m.currentPassword);
    await copyClipboard(m.currentPassword);

    return true;
}

async function showHelp(cmd: CommandOption): Promise<boolean> {
    if (DEBUG) console.log("-- showHelp");
    console.log(help);
    return true;
}

function getNoteDir(base: string): string {
    let home = getHomeDirectory();
    if (base != undefined) {
        home = base;
    }
    return `${home}/${pNoteDir}`;
}

function getProjectFilePath(base: string): string {
    const dir = getNoteDir(base);
    return `${dir}/${pNoteFile}`;
}

function getProjectKeyFilePath(base: string): string {
    const dir = getNoteDir(base);
    return `${dir}/${pNoteKeyFile}`;
}

function loadProjects(key: string = undefined, base: string): boolean {
    const dir = getNoteDir(base);

    let res = makeDir(dir);
    if (!res) {
        console.error("error: create epnote directory");
        return false;
    }
    if (
        existPath(getProjectKeyFilePath(base)) &&
        (key == undefined || key.length == 0)
    ) {
        console.error(
            "error: note file is encrypted. please set key using --secret_key option"
        );
        return false;
    }
    const list = loadProjectFile(
        getProjectFilePath(base),
        key,
        getProjectKeyFilePath(base)
    );
    if (list == undefined) {
        console.error("error: load note file");
        return false;
    }
    projectList = list;

    return true;
}

function writeProjects(key: string = undefined, base: string): boolean {
    return writeProjectFile(
        getProjectFilePath(base),
        projectList,
        key,
        getProjectKeyFilePath(base)
    );
}

function createPassword(option: ProjectType): string {
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
        if (!loadProjects(cmdLine.key, cmdLine.directory)) {
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
