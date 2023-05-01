const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = deposit;

function deposit(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Deposit",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "release_timestamp", "type": "int", "maxlength": 40, "requirements": true});
    method.addParameter({"name": "auth_key", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true});

    let tx_hash = op.load_param('hash');
    let from = op.load_param('from');
    let to = op.load_param('to');
    let uuid = op.load_param('uuid');
    let release_timestamp = op.load_param('release_timestamp');
    let auth_key = op.load_param('auth_key');

    let order_id = op.hash(tx_hash);
    let order = {
        "from": from,
        "to": to,
        "uuid": uuid,
        "release_timestamp": release_timestamp,
        "auth_key": auth_key,
        "status": 'deposited'
    };

    let owner = op.read_universal('owner', uuid);
    let existing_order = op.read_universal('order', order_id);

    // from !== to
    condition = op.ne(from, to);
    err_msg = 'You can\'t send to yourself.';
    method.addExecution(op.condition(condition, err_msg));

    // existing_order === null
    condition = op.eq(existing_order, null);
    err_msg = 'The same order already exists.';
    method.addExecution(op.condition(condition, err_msg));

    // from === owner
    condition = op.eq(from, owner);
    err_msg = "You are not the owner of the token. ";
    method.addExecution(op.condition(condition, err_msg));

    // owner = deposited;
    update = op.write_universal('owner', uuid, 'deposited');
    method.addExecution(update);

    // set order
    update = op.write_universal('order', order_id, order);
    method.addExecution(update);

    return method;
}