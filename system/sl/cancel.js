const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = cancel;

function cancel(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('contract');
    method.name('Cancel');
    method.version('1');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "order_id",
        "type": "string",
        "maxlength": SASEUL.Enc.HASH_SIZE,
        "requirements": true,
    });

    let from = op.load_param('from');
    let timestamp = op.load_param('timestamp');
    let order_id = op.load_param('order_id');
    let existing_order = op.read_universal('order', order_id);

    let order_from = op.get(existing_order, 'from');
    let order_to = op.get(existing_order, 'to');
    let order_amount = op.get(existing_order, 'amount');
    let order_release_timestamp = op.get(existing_order, 'release_timestamp');
    let order_auth_key = op.get(existing_order, 'auth_key');
    let order_status = op.get(existing_order, 'status');

    let from_balance = op.read_universal('balance', from, '0');

    let condition = op.ne(existing_order, null);
    let err_msg = 'The order does not exist.';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.eq(from, order_from);
    err_msg = 'You are not the maker of the order. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gt(timestamp, order_release_timestamp);
    err_msg = 'You can cancel an order after the release timestamp. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.eq(order_status, 'deposited');
    err_msg = 'Only orders with status "deposited" can be cancelled. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let order = {
        "from": order_from,
        "to": order_to,
        "amount": order_amount,
        "release_timestamp": order_release_timestamp,
        "auth_key": order_auth_key,
        "status": 'cancelled'
    };

    from_balance = op.add([ from_balance, order_amount ]);
    let update = op.write_universal('balance', from, from_balance);
    method.addUpdate(update);

    update = op.write_universal('order', order_id, order);
    method.addUpdate(update);

    return method;
}