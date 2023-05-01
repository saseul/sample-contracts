const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getInfo;

function getInfo(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetInfo",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    let info = op.read_universal('info', '00');

    // info !== null ?
    condition = op.ne(info, null);
    err_msg = 'The token has not been issued yet.';
    method.addExecution(op.condition(condition, err_msg));

    // return info
    response = op.response(info);
    method.addExecution(response);

    return method;
}