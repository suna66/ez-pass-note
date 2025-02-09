import { NoteType } from "./types";
import fs from "fs";

export function loadNoteFile(filename: string): Array<NoteType> {
    if (!fs.existsSync(filename)) {
        return undefined;
    }
    const text = fs.readFileSync(filename, "utf-8");

    const obj = JSON.parse(text);

    return obj;
}

export function writeNoteFile(filename: string, obj: Array<NoteType>): boolean {
    const text = JSON.stringify(obj);
    try {
        fs.writeFileSync(filename, text);
    } catch (e) {
        return false;
    }
    return true;
}

export function hasSameNoteName(name: string, obj: Array<NoteType>): boolean {
    for (let m of obj) {
        if (name == m.name) {
            return true;
        }
    }
    return false;
}

export function getNoteInfo(name: string, obj: Array<NoteType>): NoteType {
    for (let m of obj) {
        if (name == m.name) {
            return m;
        }
    }
    return undefined;
}

export function deleteNoteInfo(
    name: string,
    obj: Array<NoteType>
): Array<NoteType> {
    let index = 0;
    for (let m of obj) {
        if (name == m.name) {
            return obj.slice(index, 1);
        }
        index++;
    }
    return obj;
}
