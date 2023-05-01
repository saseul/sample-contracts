const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getBalance;

function getBalance(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetBalance",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({
        "name": "address",
        "type": "string",
        "maxlength": SASEUL.Enc.ID_HASH_SIZE,
        "requirements": true
    });

    let address = op.load_param('address');
    let balance = op.read_universal('balance', address, '0');

    // return balance
    response = op.response({
        "balance": balance
    });
    method.addExecution(response);

    return method;
}