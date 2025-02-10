# Eazy Pass Note

## Overview

Generating and management password tool

## Install

### Build & Install

```bash
$ npm i
$ npm run build
$ npm install -g .
```

## Command

```bash
epnote {COMMAND} [OPTIONS]

COMMAND:
    new {name}                 create new managed password name
    ls                         list managed password name
    get {name}                 get password and copy to clipboard(man/win)
    update {name}              update password
    history {name}             display history of password(past 10 items)
    delete {name}              delete password
    enc                        encrypt password file
    help                       show help message

OPTIONS(new):
    -s/--size {value}             password length(integer value). default is 8.
    -a/--alphabet {true/false}    using alphabet or not for password. default is true.
    -n/--number {true/false}      using numbers or not for password. default is true.
    -m/--mark {true/false}        using mark or not for password. default is true.

OPTIONS(enc):
    -e/--encrypt_key {value}       set new secret key for encrypt/decrypt password file(required)

OPTIONS(common)
    -v/--verbose                  verbose mode
    -k/--secret_key {value}       secret key for encrypt/decrypt password file(required if password file is encrypted)
```
