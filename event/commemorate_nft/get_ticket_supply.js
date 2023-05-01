const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getTicketSupply;

function getTicketSupply(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetTicketSupply",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let template_id = op.load_param('id');
    let supply = op.read_universal('supply', template_id, '0');

    // return supply
    response = op.response(supply);
    method.addExecution(response);

    return method;
}