const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = { refine, send, getBalance, deposit, cancel, approve, getOrder };

function refine(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod({
        "type": "contract",
        "name": "Refine",
        "version": "4",
        "space": _space,
        "writer": SASEUL.Enc.ZERO_ADDRESS,
    });

    method.addParameter({
        "name": "amount",
        "type": "string",
        "maxlength": 40,
        "requirements": true
    });

    let from = op.load_param('from');
    let amount = op.load_param('amount');

    let reduction_limit_default = '1000000000000000000000000000';
    let reduction = '0.84375';

    let reduction_limit = op.read_universal('reduction_limit', SASEUL.Enc.ZERO_ADDRESS, reduction_limit_default);
    let multiplier = op.read_universal('multiplier', SASEUL.Enc.ZERO_ADDRESS, '1');
    let season_supply = op.read_universal('season_supply', SASEUL.Enc.ZERO_ADDRESS, '0');
    let total_supply = op.read_universal('total_supply', SASEUL.Enc.ZERO_ADDRESS, '0');

    let from_resource = op.read_universal('resource', from, '0');
    let from_balance = op.read_universal('balance', from, '0');

    let refined_amount = op.precise_mul(amount, multiplier, 0);

    let next_multiplier = op.precise_mul(multiplier, reduction, 10);
    let min_condition = op.lt(next_multiplier, '0.0000001');
    next_multiplier = op.if(min_condition, '0.0000001', next_multiplier);

    let next_reduction_limit = op.precise_mul(reduction_limit_default, next_multiplier, 0);

    let condition, update, err_msg;

    condition = op.gt(amount, '0');
    err_msg = 'The amount to be refined must be greater than zero. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let scale = op.scale(amount);
    condition = op.eq(scale, '0');
    err_msg = 'The amount to be refined must be an integer. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gte(from_resource, amount);
    err_msg = 'The amount to be refined must be greater than or equal to the amount of resources you have. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gt(refined_amount, '0');
    err_msg = 'The refined amount must be greater than zero. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let next_condition = op.gt(season_supply, reduction_limit);

    next_multiplier = op.if(next_condition, next_multiplier, multiplier);
    update = op.write_universal('multiplier', SASEUL.Enc.ZERO_ADDRESS, next_multiplier);
    method.addUpdate(update);

    next_reduction_limit = op.if(next_condition, next_reduction_limit, reduction_limit);
    update = op.write_universal('reduction_limit', SASEUL.Enc.ZERO_ADDRESS, next_reduction_limit);
    method.addUpdate(update);

    total_supply = op.add([total_supply, refined_amount]);
    update = op.write_universal('total_supply', SASEUL.Enc.ZERO_ADDRESS, total_supply);
    method.addUpdate(update);

    season_supply = op.add([season_supply, refined_amount]);
    season_supply = op.if(next_condition, '0', season_supply);
    update = op.write_universal('season_supply', SASEUL.Enc.ZERO_ADDRESS, season_supply);
    method.addUpdate(update);

    from_resource = op.sub([from_resource, amount]);
    update = op.write_universal('resource', from, from_resource);
    method.addUpdate(update);

    from_balance = op.add([from_balance, refined_amount]);
    update = op.write_universal('balance', from, from_balance);
    method.addUpdate(update);

    return method;
}

function send(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('contract');
    method.name('Send');
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
        "name": "amount",
        "type": "string",
        "maxlength": 40,
        "requirements": true,
    });

    let from = op.load_param('from');
    let to = op.load_param('to');
    let amount = op.load_param('amount');

    let from_balance = op.read_universal('balance', from, '0');
    let to_balance = op.read_universal('balance', to, '0');

    let condition = op.ne(from, to);
    let err_msg = 'You can\'t send to yourself. ';

    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gt(amount, '0');
    err_msg = 'Amount must exceed zero. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gte(from_balance, amount);
    err_msg = 'You can\'t send more than what you have. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    from_balance = op.sub([ from_balance, amount ]);
    let update = op.write_universal('balance', from, from_balance);
    method.addUpdate(update);

    to_balance = op.add([ to_balance, amount ]);
    update = op.write_universal('balance', to, to_balance);
    method.addUpdate(update);

    return method;
}

function getBalance(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('request');
    method.name('GetBalance');
    method.version('2');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "address",
        "type": "string",
        "maxlength": SASEUL.Enc.ID_HASH_SIZE,
        "requirements": true
    });

    let address = op.load_param('address');
    let balance = op.read_universal('balance', address, '0');

    method.response({"balance":balance});

    return method;
}

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

function getOrder(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('request');
    method.name('GetOrder');
    method.version('1');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "order_id",
        "type": "string",
        "maxlength": SASEUL.Enc.HASH_SIZE,
        "requirements": true,
    });

    let order_id = op.load_param('order_id');
    let existing_order = op.read_universal('order', order_id);

    let condition = op.ne(existing_order, null);
    let err_msg = 'The order does not exist.';

    method.addCondition(op.legacy_condition(condition, err_msg));
    method.response(existing_order);

    return method;
}