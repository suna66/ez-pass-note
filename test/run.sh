#!/bin/bash -e


NOTE_DIR=.temp
TEST_ENCRYPT_KEY=testenckey
NOTE_CMD=./bin/cli.js

if [ -d ${NOTE_DIR} ]; then
    rm -rf ${NOTE_DIR}
fi
mkdir ${NOTE_DIR}

echo "--- display help"
${NOTE_CMD} help

echo "--- create new note"
# create note
create_pass=$(${NOTE_CMD} new test1 -s 16 -d ${NOTE_DIR}) || {
    echo "error new command"
    exit 1
}
echo "generated = ${create_pass}"

# create note character pattern
${NOTE_CMD} new test2 -s 20 -a true -n true -m false -d ${NOTE_DIR} || {
    echo "error new command -s 20 -a true -n true -m false"
    exit 1
}

${NOTE_CMD} new test3 -s 20 -a false -n true -m false -d ${NOTE_DIR} || {
    echo "error new command -s 20 -a false -n true -m false"
    exit 1
}

${NOTE_CMD} new test4 -s 20 -a true -n false -m false -d ${NOTE_DIR} || {
    echo "error new command -s 20 -a true -n false -m false"
    exit 1
}

${NOTE_CMD} new test5 -s 20 -a false -n false -m true -d ${NOTE_DIR} || {
    echo "error new command -s 20 -a false -n false -m true"
    exit 1
}

# ls created notes
${NOTE_CMD} ls -d ${NOTE_DIR} || {
    echo "error ls command"
    exit 1
}

get_pass=$(${NOTE_CMD} get test1 -d ${NOTE_DIR}) || {
    echo "error get command"
    exit 1
}
echo "get = ${get_pass}"

if [ "${create_pass}" != "${get_pass}" ]; then
    echo "password not equal ${create_pass} != ${get_pass}"
    exit 1
fi

echo "--- update password"
echo "update password 15 times"
for i in `seq 0 15`
do
    ${NOTE_CMD} update test1 -y -d ${NOTE_DIR} || {
        echo "error update password ${i} times"
        exit 1
    }
done

echo "--- show password history"
${NOTE_CMD} history test1 -d ${NOTE_DIR} || {
    echo "error history command"
    exit 1
}

echo "--- put new password"
${NOTE_CMD} put test1 newtestpass -d ${NOTE_DIR} -y
get_pass=$(${NOTE_CMD} get test1 -d ${NOTE_DIR})

if [ "${get_pass}" != "newtestpass" ]; then
    echo "password not equal ${get_pass} != newtestpass"
    exit 1
fi

echo "--- delete note"
${NOTE_CMD} delete test1 -d ${NOTE_DIR} -y || {
    echo "delete note error"
    exit 1
}

echo "--- encrypt note"
${NOTE_CMD} enc ${TEST_ENCRYPT_KEY} -d ${NOTE_DIR} -y || {
    echo "encrypt note error"
    exit 1
}

echo "--- create note with encrypt"
${NOTE_CMD} new test1 -s 16 -d ${NOTE_DIR} -k ${TEST_ENCRYPT_KEY} || {
    echo "error new command with encrypt"
    exit 1  
}

echo "--- get list of note with encrypt"
${NOTE_CMD} ls -d ${NOTE_DIR} -k ${TEST_ENCRYPT_KEY} || {
    echo "error ls command with encrypt"
    exit 1  
}


echo "--- get password with encrypt"
${NOTE_CMD} get test1 -d ${NOTE_DIR} -k ${TEST_ENCRYPT_KEY} || {
    echo "error get command with encrypt"
    exit 1  
}


echo "--- update password with encrypt"
${NOTE_CMD} update test1 -d ${NOTE_DIR} -k ${TEST_ENCRYPT_KEY} -y  || {
    echo "error update command with encrypt"
    exit 1  
}

echo "--- put new password with encrypt"
${NOTE_CMD} put test1 newtestpass -d ${NOTE_DIR} -k ${TEST_ENCRYPT_KEY} -y || {
    echo "error put command with encrypt"
    exit 1  
}

echo "--- delete note with encrypt"
${NOTE_CMD} delete test1 -d ${NOTE_DIR} -k ${TEST_ENCRYPT_KEY} -y || {
    echo "error delete command with encrypt"
    exit 1  
}

rm -rf ${NOTE_DIR}

echo "success"

exit 0