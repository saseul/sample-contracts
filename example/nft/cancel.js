const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = cancel;

function cancel(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Cancel",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "order_id", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true,});

    let from = op.load_param('from');
    let timestamp = op.load_param('timestamp');
    let order_id = op.load_param('order_id');

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

    // from === order_from
    condition = op.eq(from, order_from);
    err_msg = 'You are not the maker of the order.';
    method.addExecution(op.condition(condition, err_msg));

    // timestamp > order_release_timestamp
    condition = op.gt(timestamp, order_release_timestamp);
    err_msg = 'You can cancel an order after the release timestamp.';
    method.addExecution(op.condition(condition, err_msg));

    // order_status === 'deposited'
    condition = op.eq(order_status, 'deposited');
    err_msg = 'Only orders with status "deposited" can be cancelled.';
    method.addExecution(op.condition(condition, err_msg));

    // owner = from;
    update = op.write_universal('owner', order_uuid, order_from);
    method.addExecution(update);

    // set order
    update = op.write_universal('order', order_id, {
        "from": order_from,
        "to": order_to,
        "uuid": order_uuid,
        "release_timestamp": order_release_timestamp,
        "auth_key": order_auth_key,
        "status": 'cancelled'
    });
    method.addExecution(update);

    return method;
}