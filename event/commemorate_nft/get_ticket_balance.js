const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getTicketBalance;

function getTicketBalance(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetTicketBalance",
        "version": "3",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let address = op.load_param('address');
    let template_id = op.load_param('id');
    let balance = op.read_universal(op.concat(['balance_', address]), template_id, '0');

    // return balance
    response = op.response(balance);
    method.addExecution(response);

    return method;
}