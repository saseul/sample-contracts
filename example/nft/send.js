const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = send;

function send(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Send",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let to = op.load_param('to');
    let uuid = op.load_param('uuid');
    let owner = op.read_universal('owner', uuid);

    // from !== to
    condition = op.ne(from, to);
    err_msg = 'You can\'t send to yourself.';
    method.addExecution(op.condition(condition, err_msg));

    // from === owner
    condition = op.eq(from, owner);
    err_msg = "You are not the owner of the token. ";
    method.addExecution(op.condition(condition, err_msg));

    // owner = to;
    update = op.write_universal('owner', uuid, to);
    method.addExecution(update);

    return method;
}