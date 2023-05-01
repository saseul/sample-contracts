const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = deposit;

function deposit(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('contract');
    method.name('Deposit');
    method.version('2');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "to",
        "type": "string",
        "maxlength": SASEUL.Enc.ID_HASH_SIZE,
        "requirements": true,
    });

    method.addParameter({
        "name": "amount",
        "type": "string",
        "maxlength": 40,
        "requirements": true,
    });

    method.addParameter({
        "name": "release_timestamp",
        "type": "int",
        "maxlength": 40,
        "requirements": true,
    });

    method.addParameter({
        "name": "auth_key",
        "type": "string",
        "maxlength": SASEUL.Enc.HASH_SIZE,
        "requirements": true,
    });

    let tx_hash = op.load_param('hash');
    let from = op.load_param('from');
    let to = op.load_param('to');
    let amount = op.load_param('amount');
    let release_timestamp = op.load_param('release_timestamp');
    let auth_key = op.load_param('auth_key');

    let order_id = op.hash(tx_hash);
    let order = {
        "from": from,
        "to": to,
        "amount": amount,
        "release_timestamp": release_timestamp,
        "auth_key": auth_key,
        "status": 'deposited'
    };

    let from_balance = op.read_universal('balance', from, '0');
    let existing_order = op.read_universal('order', order_id);

    let condition = op.ne(from, to);
    let err_msg = 'You can\'t deposit to yourself. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.eq(existing_order, null);
    err_msg = 'The same order already exists. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gt(amount, '0');
    err_msg = 'Amount must exceed zero. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gte(from_balance, amount);
    err_msg = 'You can\'t deposit more than what you have. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    from_balance = op.sub([ from_balance, amount ]);
    let update = op.write_universal('balance', from, from_balance);
    method.addUpdate(update);

    update = op.write_universal('order', order_id, order);
    method.addUpdate(update);

    return method;
}