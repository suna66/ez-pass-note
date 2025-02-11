import { parseArgs } from "node:util";
import { startCommand } from "./commander";
import { CommandOption } from "./types";

const options = {
    size: {
        type: "string",
        short: "s",
        multiple: false,
    },
    alphabet: {
        type: "string",
        short: "a",
        multiple: false,
    },
    number: {
        type: "string",
        short: "n",
        multiple: false,
    },
    mark: {
        type: "string",
        short: "m",
        multiple: false,
    },
    secret_key: {
        type: "string",
        short: "k",
        multiple: false,
    },
    verbose: {
        type: "boolean",
        short: "v",
    },
    yes: {
        type: "boolean",
        short: "y",
    },
    dirctory: {
        type: "string",
        short: "d",
    },
} as const;

function commandOptions(): CommandOption {
    const args: Array<string> = process.argv.slice(2);
    const { values, positionals } = parseArgs({
        args: args,
        options: options,
        allowPositionals: true,
    });

    const commandOption: CommandOption = {
        size: 8,
        isAlphabet: true,
        isNumber: true,
        isMark: true,
        debug: false,
        key: undefined,
        yes: false,
        directory: undefined,
        commandList: [],
    };

    if (values["size"] != undefined) {
        const value = parseInt(values["size"]);
        if (!isNaN(value)) {
            commandOption.size = value;
        }
    }
    if (values["alphabet"] != undefined) {
        commandOption.isAlphabet = values["alphabet"] == "true" ? true : false;
    }
    if (values["number"] != undefined) {
        commandOption.isNumber = values["number"] == "true" ? true : false;
    }
    if (values["mark"] != undefined) {
        commandOption.isMark = values["mark"] == "true" ? true : false;
    }
    if (values["verbose"] != undefined) {
        commandOption.debug = values["verbose"];
    }
    if (values["secret_key"] != undefined) {
        commandOption.key = values["secret_key"];
    }
    if (values["yes"] != undefined) {
        commandOption.yes = values["yes"];
    }
    if (values["dirctory"] != undefined) {
        commandOption.directory = values["dirctory"];
    }

    if (positionals != undefined) {
        for (let pos of positionals) {
            commandOption.commandList.push(pos);
        }
    }
    return commandOption;
}

(function () {
    const cmd = commandOptions();
    startCommand(cmd).then((result) => {
        process.exit(result);
    });
})();
