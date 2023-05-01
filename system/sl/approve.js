const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = approve;

function approve(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('contract');
    method.name('Approve');
    method.version('5');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "to",
        "type": "string",
        "maxlength": SASEUL.Enc.ID_HASH_SIZE,
        "requirements": true,
    });

    method.addParameter({
        "name": "order_id",
        "type": "string",
        "maxlength": SASEUL.Enc.HASH_SIZE,
        "requirements": true,
    });

    method.addParameter({
        "name": "auth_token",
        "type": "string",
        "maxlength": SASEUL.Enc.HASH_SIZE,
        "requirements": true,
    });

    let to = op.load_param('to');
    let order_id = op.load_param('order_id');
    let auth_token = op.load_param('auth_token');
    let existing_order = op.read_universal('order', order_id);

    let order_from = op.get(existing_order, 'from');
    let order_to = op.get(existing_order, 'to');
    let order_amount = op.get(existing_order, 'amount');
    let order_release_timestamp = op.get(existing_order, 'release_timestamp');
    let order_auth_key = op.get(existing_order, 'auth_key');
    let order_status = op.get(existing_order, 'status');

    let condition = op.eq(to, order_to);
    let err_msg = 'The "to" address must be the same as the recipient. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.ne(existing_order, null);
    err_msg = 'The order does not exist.';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let auth_key = op.hash(auth_token);
    condition = op.eq(auth_key, order_auth_key);
    err_msg = 'The value "auth_token" is incorrect.';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.eq(order_status, 'deposited');
    err_msg = 'Only orders with status "deposited" can be approved. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let to_balance = op.read_universal('balance', to, '0');
    to_balance = op.add([ to_balance, order_amount ]);
    let update = op.write_universal('balance', to, to_balance);
    method.addUpdate(update);

    let order = {
        "from": order_from,
        "to": order_to,
        "amount": order_amount,
        "release_timestamp": order_release_timestamp,
        "auth_token": auth_token,
        "auth_key": order_auth_key,
        "status": 'approved'
    };

    update = op.write_universal('order', order_id, order);
    method.addUpdate(update);

    return method;
}