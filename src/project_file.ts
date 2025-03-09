import { ProjectType } from "./types";
import { decryptText, encryptText } from "./functions";
import fs from "fs";

export type NoteKeyInfoType = { iv: string; salt: string };

export function loadProjectFile(
    filename: string,
    key: string = undefined,
    keyFile: string = undefined
): Array<ProjectType> {
    if (!fs.existsSync(filename)) {
        return [];
    }

    let text = fs.readFileSync(filename, "utf-8");
    if (key != undefined && key.length > 0) {
        let keyInfo = getProjectKeyFile(keyFile);
        if (keyInfo == undefined) {
            console.error("error: note key file not found");
            return undefined;
        }
        const decrypted = decryptText(text, key, keyInfo.iv, keyInfo.salt);
        if (decrypted == undefined) {
            console.error("error: can't decrypt note file");
            return undefined;
        }
        text = decrypted;
    }

    const obj = JSON.parse(text);

    return obj;
}

export function writeProjectFile(
    filename: string,
    obj: Array<ProjectType>,
    key: string = undefined,
    keyFile: string = undefined
): boolean {
    let text = JSON.stringify(obj);
    try {
        if (key != undefined && key.length > 0) {
            const encrypted = encryptText(text, key);
            if (encrypted == undefined) {
                console.error("error: note file encrypt error");
                return false;
            }
            if (!writeProjectKeyFile(keyFile, encrypted.iv, encrypted.salt)) {
                console.error("error: can't update key file");
                return false;
            }
            text = encrypted.cipherText;
        }
        fs.writeFileSync(filename, text);
    } catch (e) {
        console.error(e.toString());
        return false;
    }
    return true;
}

export function getProjectKeyFile(filename: string): NoteKeyInfoType {
    if (!fs.existsSync(filename)) {
        return undefined;
    }
    const text = fs.readFileSync(filename, "utf-8");
    let lines = text.split("\n");
    if (lines.length < 2) {
        console.error("error: key file format error");
        return undefined;
    }
    return { iv: lines[0], salt: lines[1] };
}

export function writeProjectKeyFile(
    filename: string,
    iv: string,
    salt: string
): boolean {
    const text = `${iv}\n${salt}`;
    try {
        fs.writeFileSync(filename, text);
    } catch (e) {
        return false;
    }
    return true;
}

export function hasSameProjectName(
    name: string,
    obj: Array<ProjectType>
): boolean {
    for (let m of obj) {
        if (name == m.name) {
            return true;
        }
    }
    return false;
}

export function getProjectInfo(
    name: string,
    obj: Array<ProjectType>
): ProjectType {
    for (let m of obj) {
        if (name == m.name) {
            return m;
        }
    }
    return undefined;
}

export function deleteProjectInfo(
    name: string,
    obj: Array<ProjectType>
): Array<ProjectType> {
    let index = 0;
    for (let m of obj) {
        if (name == m.name) {
            obj.splice(index, 1);
            return obj;
        }
        index++;
    }
    return obj;
}
