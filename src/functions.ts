import fs from "fs";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import which from "which";

export type EncryptType = {
    cipherText: string;
    iv: string;
    salt: string;
};

export function getHomeDirectory(): string {
    return process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
}

export function existPath(path: string): boolean {
    if (fs.existsSync(path)) {
        return true;
    }
    return false;
}

export function makeDir(path: string): boolean {
    try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    } catch (e) {
        return false;
    }
    return true;
}

export function hasString(src: string, key: string): boolean {
    for (let c of src) {
        for (let k of key) {
            if (c == k) {
                return true;
            }
        }
    }
    return false;
}

export function createRandomString(
    size: number,
    ascii: string,
    num: string,
    mark: string
): string {
    if (size < 8) {
        return undefined;
    }
    let key = "";
    if (ascii != undefined) {
        key += ascii;
    }
    if (num != undefined) {
        key += num;
    }
    if (mark != undefined) {
        key += mark;
    }
    let str = "";
    while (1) {
        str = Array.from(crypto.getRandomValues(new Uint8Array(size)))
            .map((n) => key[n % key.length])
            .join("");

        if (ascii != undefined) {
            if (!hasString(str, ascii)) continue;
        }
        if (num != undefined) {
            if (!hasString(str, num)) continue;
        }
        if (mark != undefined) {
            if (!hasString(str, mark)) continue;
        }
        break;
    }
    return str;
}

export async function copyClipboard(str: string) {
    const platform = process.platform;

    let cmd = "clip";
    if (platform == "darwin") {
        // Mac
        cmd = "pbcopy";
    } else if (platform == "linux") {
        // Linux
        const exist = await which("xsel", { nothrow: true });
        if (exist == null) {
            return false;
        }
        cmd = "xsel --clipboard --input";
    }
    const proc = spawn(cmd);
    proc.stdin.write(str, "utf8");
    await new Promise((r) => proc.stdin.end(r));

    return true;
}

export function encryptText(text: string, password: string): EncryptType {
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const cipherText = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    return {
        cipherText: Buffer.from(cipherText).toString("base64"),
        iv: Buffer.from(iv).toString("base64"),
        salt: Buffer.from(salt).toString("base64"),
    };
}

export function decryptText(
    encryptText: string,
    password: string,
    iv: string,
    salt: string
): string {
    const byteIV = Buffer.from(iv, "base64");
    const byteSalt = Buffer.from(salt, "base64");
    const key = crypto.scryptSync(password, byteSalt, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, byteIV);

    const binData = Buffer.from(encryptText, "base64");

    //@ts-ignore
    const start = decipher.update(binData, "utf8");
    const final = decipher.final();

    const result = Buffer.concat([start, final]).toString("utf8");

    return result;
}
