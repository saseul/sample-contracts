const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getBalance;

function getBalance(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('request');
    method.name('GetBalance');
    method.version('2');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "address",
        "type": "string",
        "maxlength": SASEUL.Enc.ID_HASH_SIZE,
        "requirements": true
    });

    let address = op.load_param('address');
    let balance = op.read_universal('balance', address, '0');

    method.response({"balance":balance});

    return method;
}