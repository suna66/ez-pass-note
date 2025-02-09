# Eazy Pass Memo tool

## Overview

Generating and management password memo tool

## Install

### Build & Install

```bash
$ npm i
$ npm run build
$ npm install -g .
```

## Command

```bash
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
```

