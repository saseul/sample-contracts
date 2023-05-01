const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = approve;

function approve(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Approve",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "order_id", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true});
    method.addParameter({"name": "auth_token", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true,});

    let order_id = op.load_param('order_id');
    let auth_token = op.load_param('auth_token');

    let existing_order = op.read_universal('order', order_id);

    let order_from = op.get(existing_order, 'from');
    let order_to = op.get(existing_order, 'to');
    let order_uuid = op.get(existing_order, 'uuid');
    let order_release_timestamp = op.get(existing_order, 'release_timestamp');
    let order_auth_key = op.get(existing_order, 'auth_key');
    let order_status = op.get(existing_order, 'status');

    // existing_order !== null
    condition = op.ne(existing_order, null);
    err_msg = 'The order does not exist.';
    method.addExecution(op.condition(condition, err_msg));

    // hash(auth_token) === order_auth_key
    condition = op.eq(op.hash(auth_token), order_auth_key);
    err_msg = 'The value "auth_token" is incorrect.';
    method.addExecution(op.condition(condition, err_msg));

    // order_status === 'deposited'
    condition = op.eq(order_status, 'deposited');
    err_msg = 'Only orders with status "deposited" can be approved.';
    method.addExecution(op.condition(condition, err_msg));

    // owner = to;
    update = op.write_universal('owner', order_uuid, order_to);
    method.addExecution(update);

    // set order
    update = op.write_universal('order', order_id, {
        "from": order_from,
        "to": order_to,
        "uuid": order_uuid,
        "release_timestamp": order_release_timestamp,
        "auth_token": auth_token,
        "auth_key": order_auth_key,
        "status": 'approved'
    });
    method.addExecution(update);

    return method;
}