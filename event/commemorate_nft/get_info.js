const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getInfo;

function getInfo(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetInfo",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let uuid = op.load_param('uuid');
    let info = op.read_universal('info', uuid);
    let owner = op.read_universal('owner', uuid);
    let used = op.read_universal('used', uuid);
    let generation_used = op.read_universal('generation_used', uuid);

    // info !== null ?
    condition = op.ne(info, null);
    err_msg = 'There is no token with the given UUID.';
    method.addExecution(op.condition(condition, err_msg));

    // return info
    response = op.response({
        "uuid": uuid,
        "owner": owner,
        "used": used,
        "generation_used": generation_used,
        "info": info
    });
    method.addExecution(response);

    return method;
}