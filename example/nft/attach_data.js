const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = attachData;

function attachData(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AttachData",
        "version": "1",
        "space": space,
        "writer": writer,
    });
    method.addParameter({"name": "data", "type": "string", "maxlength": 1048576, "requirements": true});

    let from = op.load_param('from');

    // from === writer
    condition = op.eq(from, writer);
    err_msg = 'You are not the owner of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    return method;
}