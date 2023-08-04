const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = {
    mint,
    send,
    getInfo,
    listItem,
    deposit,
    approve,
    cancel,
    getOrder,
    issue,
    transfer,
    getBalance,
    store,
    confirm,
    retrieve,
    getEntry,
    cProfile,
    rProfile,
    stamp
};

// token
// balance
// inventory
// entry
// info
// owner
// order
// profile

function cProfile(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Profile",
        "version": "3",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "nickname", "type": "string", "maxlength": 20, "requirements": true});
    method.addParameter({"name": "tag", "type": "string", "maxlength": 4, "requirements": true});
    method.addParameter({"name": "thumbnail", "type": "string", "maxlength": 80, "requirements": true});

    let from = op.load_param('from');
    let nickname = op.load_param('nickname');
    let tag = op.load_param('tag');
    let thumbnail = op.load_param('thumbnail');

    let profile = {
        "nickname": nickname,
        "tag": tag,
        "thumbnail": thumbnail
    };

    // nickname regexp ?
    condition = op.reg_match('/^[A-Za-z_0-9]*$/', nickname);
    err_msg = 'The nickname must consist of A-Za-z_0-9.';
    method.addExecution(op.condition(condition, err_msg));

    // tag regexp ?
    condition = op.reg_match('/^[0-9]*$/', tag);
    err_msg = 'The tag must consist of 0-9.';
    method.addExecution(op.condition(condition, err_msg));

    // thumbnail regexp ?
    condition = op.reg_match('/^[A-Fa-f0-9]*$/', thumbnail);
    err_msg = 'The thumbnail must consist of a hex string';
    method.addExecution(op.condition(condition, err_msg));

    update = op.write_universal('profile', from, profile);
    method.addExecution(update);

    return method;
}

function rProfile(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "Profile",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let address = op.load_param('address');
    let profile = op.read_universal('profile', address);

    // info !== null ?
    condition = op.ne(profile, null);
    err_msg = 'There is no profile with the given address.';
    method.addExecution(op.condition(condition, err_msg));

    // return info
    response = op.response(profile);
    method.addExecution(response);

    return method;
}

function mint(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Mint",
        "version": "3",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "name", "type": "string", "maxlength": 80, "requirements": true});
    method.addParameter({"name": "description", "type": "string", "maxlength": 2000, "requirements": false});
    method.addParameter({"name": "data", "type": "any", "maxlength": 1048576, "requirements": true});
    method.addParameter({"name": "ext", "type": "string", "maxlength": 50, "requirements": true});

    let from = op.load_param('from');

    let name = op.load_param('name');
    let description = op.load_param('description');
    let contents_type = op.load_param('ext');

    let tx_hash = op.load_param('hash');
    let uuid = op.id_hash(tx_hash);

    let from_balance = op.read_universal('balance', from, '0');

    // balance >= 1
    condition = op.gte(from_balance, '1');
    err_msg = 'To mint an item, you need to have the minting token.';
    method.addExecution(op.condition(condition, err_msg));

    // balance = balance - 1;
    from_balance = op.sub([ from_balance, '1' ]);
    update = op.write_universal('balance', from, from_balance);
    method.addExecution(update);

    // save token_info
    update = op.write_universal('info', uuid, {
        "name": name,
        "description": description,
        "publisher": from,
        "stamped_by": from,
        "contents_type": contents_type,
        "contents": tx_hash
    });
    method.addExecution(update);

    // save owner
    update = op.write_universal('owner', uuid, from);
    method.addExecution(update);

    // inventory from = 1
    let inventory = op.concat(['inventory_', from]);
    update = op.write_universal(inventory, uuid, 1);
    method.addExecution(update);

    return method;
}

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

    // inventory: from = 0
    let inventory_from = op.concat(['inventory_', from]);
    update = op.write_universal(inventory_from, uuid, 0);
    method.addExecution(update);

    // inventory: to = 1
    let inventory_to = op.concat(['inventory_', to]);
    update = op.write_universal(inventory_to, uuid, 1);
    method.addExecution(update);

    return method;
}

function stamp(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Stamp",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let uuid = op.load_param('uuid');
    let owner = op.read_universal('owner', uuid);
    let info = op.read_universal('info', uuid);

    let name = op.get(info, 'name');
    let description = op.get(info, 'description');
    let publisher = op.get(info, 'publisher');
    let contents_type = op.get(info, 'contents_type');
    let contents = op.get(info, 'contents');

    // from === owner
    condition = op.eq(from, owner);
    err_msg = "You are not the owner of the token. ";
    method.addExecution(op.condition(condition, err_msg));

    // stamped_by = from
    update = op.write_universal('info', uuid, {
        "name": name,
        "description": description,
        "publisher": publisher,
        "stamped_by": from,
        "contents_type": contents_type,
        "contents": contents
    });
    method.addExecution(update);

    return method;
}

function getInfo(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetInfo",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let uuid = op.load_param('uuid');
    let info = op.read_universal('info', uuid);
    let owner = op.read_universal('owner', uuid);

    // info !== null ?
    condition = op.ne(info, null);
    err_msg = 'There is no token with the given UUID.';
    method.addExecution(op.condition(condition, err_msg));

    // return info
    response = op.response({
        "uuid": uuid,
        "owner": owner,
        "info": info
    });
    method.addExecution(response);

    return method;
}

function listItem(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ListItem",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "page", "type": "int", "maxlength": 5, "requirements": true});
    method.addParameter({"name": "count", "type": "int", "maxlength": 4, "requirements": true});

    let page = op.load_param('page');
    let count = op.load_param('count');
    let address = op.load_param('address');
    let inventory = op.concat(['inventory_', address]);

    let list = op.list_universal(inventory, page, count);
    response = op.response(list);
    method.addExecution(response);

    return method;
}

function deposit(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Deposit",
        "version": "1",
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

    // inventory: from = 0
    let inventory_from = op.concat(['inventory_', from]);
    update = op.write_universal(inventory_from, uuid, 0);
    method.addExecution(update);

    // set order
    update = op.write_universal('order', order_id, order);
    method.addExecution(update);

    return method;
}

function approve(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Approve",
        "version": "1",
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

    // inventory: to = 1
    let inventory_to = op.concat(['inventory_', order_to]);
    update = op.write_universal(inventory_to, order_uuid, 1);
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

    // inventory: from = 1
    let inventory_from = op.concat(['inventory_', order_from]);
    update = op.write_universal(inventory_from, order_uuid, 1);
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

function getOrder(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetOrder",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "order_id", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true,});

    let order_id = op.load_param('order_id');
    let existing_order = op.read_universal('order', order_id);

    // existing_order !== null
    condition = op.ne(existing_order, null);
    err_msg = 'The order does not exist.';
    method.addExecution(op.condition(condition, err_msg));

    response = op.response(existing_order);
    method.addExecution(response);

    return method;
}

function issue(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Issue",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "name", "type": "string", "maxlength": 80, "requirements": true});
    method.addParameter({"name": "symbol", "type": "string", "maxlength": 20, "requirements": true});
    method.addParameter({"name": "amount", "type": "string", "maxlength": 80, "requirements": true});

    let from = op.load_param('from');
    let name = op.load_param('name');
    let symbol = op.load_param('symbol');
    let amount = op.load_param('amount');

    let info = op.read_universal('token', '00');

    // info === null
    condition = op.eq(info, null);
    err_msg = 'The token can only be issued once.';
    method.addExecution(op.condition(condition, err_msg));

    // writer === from
    condition = op.eq(writer, from);
    err_msg = 'You are not the contract writer.';
    method.addExecution(op.condition(condition, err_msg));

    // amount > 0
    condition = op.gt(amount, '0');
    err_msg = 'The amount must be greater than 0.';
    method.addExecution(op.condition(condition, err_msg));

    // save info
    update = op.write_universal('token', '00', {
        "name": name,
        "symbol": symbol,
        "total_supply": amount,
    });
    method.addExecution(update);

    // from balance = amount;
    update = op.write_universal('balance', from, amount);
    method.addExecution(update);

    return method;
}

function transfer(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Transfer",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "amount", "type": "string", "maxlength": 40, "requirements": true});

    let from = op.load_param('from');
    let to = op.load_param('to');
    let amount = op.load_param('amount');

    let from_balance = op.read_universal('balance', from, '0');
    let to_balance = op.read_universal('balance', to, '0');

    // from !== to
    condition = op.ne(from, to);
    err_msg = 'You can\'t send to yourself.';
    method.addExecution(op.condition(condition, err_msg));

    // amount > 0
    condition = op.gt(amount, '0');
    err_msg = 'The amount must be greater than 0.';
    method.addExecution(op.condition(condition, err_msg));

    // from_balance >= amount
    condition = op.gte(from_balance, amount);
    err_msg = 'You can\'t send more than what you have.';
    method.addExecution(op.condition(condition, err_msg));

    // from_balance = from_balance - amount;
    from_balance = op.sub([ from_balance, amount ]);
    update = op.write_universal('balance', from, from_balance);
    method.addExecution(update);

    // to_balance = to_balance + amount;
    to_balance = op.add([ to_balance, amount ]);
    update = op.write_universal('balance', to, to_balance);
    method.addExecution(update);

    return method;
}

function getBalance(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetBalance",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({
        "name": "address",
        "type": "string",
        "maxlength": SASEUL.Enc.ID_HASH_SIZE,
        "requirements": true
    });

    let address = op.load_param('address');
    let balance = op.read_universal('balance', address, '0');

    // return balance
    response = op.response({
        "balance": balance
    });
    method.addExecution(response);

    return method;
}

function store(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Store",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "amount", "type": "string", "maxlength": 40, "requirements": true});
    method.addParameter({"name": "release_timestamp", "type": "int", "maxlength": 40, "requirements": true});
    method.addParameter({"name": "auth_key", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true});

    let tx_hash = op.load_param('hash');
    let from = op.load_param('from');
    let to = op.load_param('to');
    let amount = op.load_param('amount');
    let release_timestamp = op.load_param('release_timestamp');
    let auth_key = op.load_param('auth_key');

    let entry_id = op.hash(tx_hash);
    let entry = {
        "from": from,
        "to": to,
        "amount": amount,
        "release_timestamp": release_timestamp,
        "auth_key": auth_key,
        "status": 'deposited'
    };

    let from_balance = op.read_universal('balance', from, '0');
    let existing_entry = op.read_universal('entry', entry_id);

    // from !== to
    condition = op.ne(from, to);
    err_msg = 'You can\'t deposit to yourself.';
    method.addExecution(op.condition(condition, err_msg));

    // existing_entry === null
    condition = op.eq(existing_entry, null);
    err_msg = 'The same entry already exists.';
    method.addExecution(op.condition(condition, err_msg));

    // amount > 0
    condition = op.gt(amount, '0');
    err_msg = 'The amount must be greater than 0.';
    method.addExecution(op.condition(condition, err_msg));

    // from_balance >= amount
    condition = op.gte(from_balance, amount);
    err_msg = 'You can\'t deposit more than what you have.';
    method.addExecution(op.condition(condition, err_msg));

    // from_balance = from_balance - amount;
    from_balance = op.sub([ from_balance, amount ]);
    update = op.write_universal('balance', from, from_balance);
    method.addExecution(update);

    // set entry
    update = op.write_universal('entry', entry_id, entry);
    method.addExecution(update);

    return method;
}

function confirm(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Confirm",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "entry_id", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true});
    method.addParameter({"name": "auth_token", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true,});

    let to = op.load_param('to');
    let entry_id = op.load_param('entry_id');
    let auth_token = op.load_param('auth_token');

    let existing_entry = op.read_universal('entry', entry_id);

    let entry_from = op.get(existing_entry, 'from');
    let entry_to = op.get(existing_entry, 'to');
    let entry_amount = op.get(existing_entry, 'amount');
    let entry_release_timestamp = op.get(existing_entry, 'release_timestamp');
    let entry_auth_key = op.get(existing_entry, 'auth_key');
    let entry_status = op.get(existing_entry, 'status');

    let to_balance = op.read_universal('balance', to, '0');

    // to === entry_to
    condition = op.eq(to, entry_to);
    err_msg = 'The "to" address must be the same as the recipient. ';
    method.addExecution(op.condition(condition, err_msg));

    // existing_entry !== null
    condition = op.ne(existing_entry, null);
    err_msg = 'The entry does not exist.';
    method.addExecution(op.condition(condition, err_msg));

    // hash(auth_token) === entry_auth_key
    condition = op.eq(op.hash(auth_token), entry_auth_key);
    err_msg = 'The value "auth_token" is incorrect.';
    method.addExecution(op.condition(condition, err_msg));

    // entry_status === 'deposited'
    condition = op.eq(entry_status, 'deposited');
    err_msg = 'Only entries with status "deposited" can be confirmed.';
    method.addExecution(op.condition(condition, err_msg));

    // to_balance = to_balance + amount;
    to_balance = op.add([ to_balance, entry_amount ]);
    update = op.write_universal('balance', entry_to, to_balance);
    method.addExecution(update);

    // set entry
    update = op.write_universal('entry', entry_id, {
        "from": entry_from,
        "to": entry_to,
        "amount": entry_amount,
        "release_timestamp": entry_release_timestamp,
        "auth_token": auth_token,
        "auth_key": entry_auth_key,
        "status": 'confirmed'
    });
    method.addExecution(update);

    return method;
}

function retrieve(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Retrieve",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "entry_id", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true,});

    let from = op.load_param('from');
    let timestamp = op.load_param('timestamp');
    let entry_id = op.load_param('entry_id');

    let existing_entry = op.read_universal('entry', entry_id);

    let entry_from = op.get(existing_entry, 'from');
    let entry_to = op.get(existing_entry, 'to');
    let entry_amount = op.get(existing_entry, 'amount');
    let entry_release_timestamp = op.get(existing_entry, 'release_timestamp');
    let entry_auth_key = op.get(existing_entry, 'auth_key');
    let entry_status = op.get(existing_entry, 'status');

    let from_balance = op.read_universal('balance', from, '0');

    // existing_entry !== null
    condition = op.ne(existing_entry, null);
    err_msg = 'The entry does not exist.';
    method.addExecution(op.condition(condition, err_msg));

    // from === entry_from
    condition = op.eq(from, entry_from);
    err_msg = 'You are not the maker of the entry.';
    method.addExecution(op.condition(condition, err_msg));

    // timestamp > entry_release_timestamp
    condition = op.gt(timestamp, entry_release_timestamp);
    err_msg = 'You can cancel an entry after the release timestamp.';
    method.addExecution(op.condition(condition, err_msg));

    // entry_status === 'deposited'
    condition = op.eq(entry_status, 'deposited');
    err_msg = 'Only entries with status "deposited" can be cancelled.';
    method.addExecution(op.condition(condition, err_msg));

    // from_balance = from_balance + amount;
    from_balance = op.add([ from_balance, entry_amount ]);
    update = op.write_universal('balance', from, from_balance);
    method.addExecution(update);

    // set entry
    update = op.write_universal('entry', entry_id, {
        "from": entry_from,
        "to": entry_to,
        "amount": entry_amount,
        "release_timestamp": entry_release_timestamp,
        "auth_key": entry_auth_key,
        "status": 'cancelled'
    });
    method.addExecution(update);

    return method;
}

function getEntry(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetEntry",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "entry_id", "type": "string", "maxlength": SASEUL.Enc.HASH_SIZE, "requirements": true,});

    let entry_id = op.load_param('entry_id');
    let existing_entry = op.read_universal('entry', entry_id);

    // existing_entry !== null
    condition = op.ne(existing_entry, null);
    err_msg = 'The entry does not exist.';
    method.addExecution(op.condition(condition, err_msg));

    // response = existing_entry
    response = op.response(existing_entry);
    method.addExecution(response);

    return method;
}