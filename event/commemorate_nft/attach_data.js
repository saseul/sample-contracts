const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = attachData;

function attachData(writer, space) {
    let condition, err_msg;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AttachData",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "data", "type": "string", "maxlength": 1048576, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    return method;
}