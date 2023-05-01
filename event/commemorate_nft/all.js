const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = {
    grant,
    revoke,
    attachData,
    addTemplate,
    listTemplate,
    readTemplate,
    createTicket,
    burnTicket,
    getTicketBalance,
    getTicketSupply,
    mint,
    addExchanger,
    setGenerator,
    takeTicket,
    generate,
    getInfo,
    listToken,
    send,
    deposit,
    approve,
    cancel,
    getOrder
};

function grant(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Grant",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let address = op.load_param('address');
    let is_manager = op.read_universal('manager', address);

    // from === writer
    condition = op.eq(from, writer);
    err_msg = 'You are not the owner of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // is_manager !== true
    condition = op.ne(is_manager, true);
    err_msg = 'The address is already authorized as a manager.';
    method.addExecution(op.condition(condition, err_msg));

    // manager.address = true
    update = op.write_universal('manager', address, true);
    method.addExecution(update);

    return method;
}

function revoke(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Revoke",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let address = op.load_param('address');
    let is_manager = op.read_universal('manager', address);

    // from === writer
    condition = op.eq(from, writer);
    err_msg = 'You are not the owner of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // is_manager === true
    condition = op.eq(is_manager, true);
    err_msg = 'The address does not have manager authorization.';
    method.addExecution(op.condition(condition, err_msg));

    // manager.address = false
    update = op.write_universal('manager', address, false);
    method.addExecution(update);

    return method;
}

function attachData(writer, space) {
    let condition, err_msg;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AttachData",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "data", "type": "string", "maxlength": 1048576, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    return method;
}

function addTemplate(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AddTemplate",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "name", "type": "string", "maxlength": 80, "requirements": true});
    method.addParameter({"name": "description", "type": "string", "maxlength": 2000, "requirements": false});
    method.addParameter({"name": "thumbnail", "type": "any", "maxlength": 4096, "requirements": false});
    method.addParameter({"name": "contents_type", "type": "string", "maxlength": 50, "requirements": true});
    method.addParameter({"name": "contents", "type": "any", "maxlength": 65536, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let name = op.load_param('name');
    let description = op.load_param('description');
    let thumbnail = op.load_param('thumbnail');
    let contents_type = op.load_param('contents_type');
    let contents = op.load_param('contents');

    let template_id = op.id_hash(name);
    let existing_template = op.read_universal('template', template_id);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // existing_template === null
    condition = op.eq(existing_template, null);
    err_msg = 'The template already exists with the same name.';
    method.addExecution(op.condition(condition, err_msg));

    // save template
    update = op.write_universal('template', template_id, {
        "name": name,
        "description": description,
        "thumbnail": thumbnail,
        "contents_type": contents_type,
        "contents": contents
    });
    method.addExecution(update);

    return method;
}

function listTemplate(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ListTemplate",
        "version": "3",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "page", "type": "int", "maxlength": 5, "requirements": true});
    method.addParameter({"name": "count", "type": "int", "maxlength": 4, "requirements": true});

    let page = op.load_param('page');
    let count = op.load_param('count');

    page = op.sub([page, 1]);

    // return list
    let list = op.list_universal('template', page, count);
    response = op.response(list);
    method.addExecution(response);

    return method;
}

function readTemplate(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ReadTemplate",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let template_id = op.load_param('id');
    let template = op.read_universal('template', template_id);

    // template !== null ?
    condition = op.ne(template, null);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // return template
    response = op.response(template);
    method.addExecution(response);

    return method;
}

function createTicket(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "CreateTicket",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "amount", "type": "string", "maxlength": 3, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let template_id = op.load_param('id');
    let template = op.read_universal('template', template_id);

    let to = op.load_param('to');
    let amount = op.load_param('amount');

    let balance = op.read_universal(op.concat(['balance_', template_id]), to, '0');
    let supply = op.read_universal('supply', template_id, '0');

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // template !== null
    condition = op.ne(template, null);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // amount > 0
    condition = op.gt(amount, '0');
    err_msg = 'The amount must be greater than zero.';
    method.addExecution(op.condition(condition, err_msg));

    // supply + amount <= 500
    condition = op.lte(
        op.add([amount, supply]), '500'
    );
    err_msg = 'The maximum number of tokens of the same type that can be issued is 500.';
    method.addExecution(op.condition(condition, err_msg));

    // supply = supply + amount
    supply = op.add([ supply, amount ]);
    update = op.write_universal('supply', template_id, supply);
    method.addExecution(update);

    // balance = balance + amount
    balance = op.add([ balance, amount ]);
    update = op.write_universal(op.concat(['balance_', template_id]), to, balance);
    method.addExecution(update);

    return method;
}

function burnTicket(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "BurnTicket",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "to", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "amount", "type": "string", "maxlength": 3, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let template_id = op.load_param('id');

    let to = op.load_param('to');
    let amount = op.load_param('amount');

    let balance = op.read_universal(op.concat(['balance_', template_id]), to, '0');
    let supply = op.read_universal('supply', template_id, '0');

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // amount > 0
    condition = op.gt(amount, '0');
    err_msg = 'The amount must be greater than zero.';
    method.addExecution(op.condition(condition, err_msg));

    // balance >= amount
    condition = op.gte(balance, amount);
    err_msg = 'Insufficient ticket balance.';
    method.addExecution(op.condition(condition, err_msg));

    // supply = supply - amount
    supply = op.sub([ supply, amount ]);
    update = op.write_universal('supply', template_id, supply);
    method.addExecution(update);

    // balance = balance - amount
    balance = op.sub([ balance, amount ]);
    update = op.write_universal(op.concat(['balance_', template_id]), to, balance);
    method.addExecution(update);

    return method;
}

function getTicketBalance(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetTicketBalance",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let address = op.load_param('address');
    let template_id = op.load_param('id');
    let balance = op.read_universal(op.concat(['balance_', template_id]), address, '0');

    // return balance
    response = op.response(balance);
    method.addExecution(response);

    return method;
}

function getTicketSupply(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetTicketSupply",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let template_id = op.load_param('id');
    let supply = op.read_universal('supply', template_id, '0');

    // return supply
    response = op.response(supply);
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

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let template_id = op.load_param('id');
    let template = op.read_universal('template', template_id);

    let tx_hash = op.load_param('hash');
    let uuid = op.id_hash(tx_hash);

    let ticket_balance = op.read_universal(op.concat(['balance_', template_id]), from, '0');
    let owner = op.read_universal('owner', uuid);

    // balance > 0
    condition = op.gt(ticket_balance, '0');
    err_msg = 'The balance must be greater than zero.';
    method.addExecution(op.condition(condition, err_msg));

    // owner === null
    condition = op.eq(owner, null);
    err_msg = 'A token with the same UUID already exists.';
    method.addExecution(op.condition(condition, err_msg));

    // save token_info
    update = op.write_universal('info', uuid, template);
    method.addExecution(update);

    // save used
    update = op.write_universal('used', uuid, false);
    method.addExecution(update);

    // save generation_used
    update = op.write_universal('generation_used', uuid, false);
    method.addExecution(update);

    // save owner
    update = op.write_universal('owner', uuid, from);
    method.addExecution(update);

    // ticket balance = ticket balance - 1
    ticket_balance = op.sub([ticket_balance, '1']);
    update = op.write_universal(op.concat(['balance_', template_id]), from, ticket_balance);
    method.addExecution(update);

    return method;
}

function addExchanger(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AddExchanger",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "input_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "output_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let input_id = op.load_param('input_id');
    let output_id = op.load_param('output_id');
    let input = op.read_universal('template', input_id);
    let output = op.read_universal('template', output_id);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // input !== null, output !== null
    condition = op.and([
        op.ne(input, null),
        op.ne(output, null)
    ]);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // set exchanger
    update = op.write_universal('exchanger', output_id, input_id);
    method.addExecution(update);

    return method;
}

function setGenerator(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "SetGenerator",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id1", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id2", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id3", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id4", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "output_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let template_id1 = op.load_param('id1');
    let template_id2 = op.load_param('id2');
    let template_id3 = op.load_param('id3');
    let template_id4 = op.load_param('id4');
    let output_id = op.load_param('output_id');
    let template1 = op.read_universal('template', template_id1);
    let template2 = op.read_universal('template', template_id2);
    let template3 = op.read_universal('template', template_id3);
    let template4 = op.read_universal('template', template_id4);
    let output = op.read_universal('template', output_id);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // template1 !== null, ... output !== null
    condition = op.and([
        op.ne(template1, null),
        op.ne(template2, null),
        op.ne(template3, null),
        op.ne(template4, null),
        op.ne(output, null),
    ]);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // set generator
    let generator = {
        "input1": template_id1,
        "input2": template_id2,
        "input3": template_id3,
        "input4": template_id4,
        "output": output_id,
    };
    update = op.write_universal('generator', '00', generator);
    method.addExecution(update);

    return method;
}

function takeTicket(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "TakeTicket",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "output_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let uuid = op.load_param('uuid');

    let info = op.read_universal('info', uuid);
    let used = op.read_universal('used', uuid);
    let owner = op.read_universal('owner', uuid);

    let input_id = op.id_hash(op.get(info, 'name'));
    let output_id = op.load_param('output_id');

    let exchanger = op.read_universal('exchanger', output_id);
    let balance = op.read_universal(op.concat(['balance_', output_id]), from, '0');
    let supply = op.read_universal('supply', output_id, '0');

    // exchanger !== null
    condition = op.ne(exchanger, null);
    err_msg = 'There is no exchanger.';
    method.addExecution(op.condition(condition, err_msg));

    // exchanger === input_id
    condition = op.eq(exchanger, input_id);
    err_msg = 'The token does not satisfy the exchanger requirements.';
    method.addExecution(op.condition(condition, err_msg));

    // used === false
    condition = op.eq(used, false);
    err_msg = 'All tokens must be in an unused state.';
    method.addExecution(op.condition(condition, err_msg));

    // owner === from
    condition = op.eq(owner, from);
    err_msg = 'You are not the owner of the token.';
    method.addExecution(op.condition(condition, err_msg));

    // supply = supply + 1
    supply = op.add([ supply, '1' ]);
    update = op.write_universal('supply', output_id, supply);
    method.addExecution(update);

    // balance = balance + 1
    balance = op.add([ balance, '1' ]);
    update = op.write_universal(op.concat(['balance_', output_id]), from, balance);
    method.addExecution(update);

    return method;
}

function generate(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Generate",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid1", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid2", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid3", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid4", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let generator = op.read_universal('generator', '00');

    let uuid1 = op.load_param('uuid1');
    let uuid2 = op.load_param('uuid2');
    let uuid3 = op.load_param('uuid3');
    let uuid4 = op.load_param('uuid4');

    let info1 = op.read_universal('info', uuid1);
    let info2 = op.read_universal('info', uuid2);
    let info3 = op.read_universal('info', uuid3);
    let info4 = op.read_universal('info', uuid4);

    let used1 = op.read_universal('generation_used', uuid1);
    let used2 = op.read_universal('generation_used', uuid2);
    let used3 = op.read_universal('generation_used', uuid3);
    let used4 = op.read_universal('generation_used', uuid4);

    let owner1 = op.read_universal('owner', uuid1);
    let owner2 = op.read_universal('owner', uuid2);
    let owner3 = op.read_universal('owner', uuid3);
    let owner4 = op.read_universal('owner', uuid4);

    let id1 = op.id_hash(op.get(info1, 'name'));
    let id2 = op.id_hash(op.get(info2, 'name'));
    let id3 = op.id_hash(op.get(info3, 'name'));
    let id4 = op.id_hash(op.get(info4, 'name'));

    let input_id1 = op.get(generator, 'input1');
    let input_id2 = op.get(generator, 'input2');
    let input_id3 = op.get(generator, 'input3');
    let input_id4 = op.get(generator, 'input4');
    let output_id = op.get(generator, 'output');

    let balance = op.read_universal(op.concat(['balance_', output_id]), from, '0');
    let supply = op.read_universal('supply', output_id, '0');

    // generator !== null
    condition = op.ne(generator, null);
    err_msg = 'There is no generator.';
    method.addExecution(op.condition(condition, err_msg));

    // id1 === input_id1, ...
    condition = op.and([
        op.eq(id1, input_id1),
        op.eq(id2, input_id2),
        op.eq(id3, input_id3),
        op.eq(id4, input_id4),
    ]);
    err_msg = 'The token does not satisfy the generator requirements.';
    method.addExecution(op.condition(condition, err_msg));

    // used1 === false, ...
    condition = op.and([
        op.eq(used1, false),
        op.eq(used2, false),
        op.eq(used3, false),
        op.eq(used4, false),
    ]);
    err_msg = 'All tokens must not have been used for generation.';
    method.addExecution(op.condition(condition, err_msg));

    // owner1 === from, ...
    condition = op.and([
        op.eq(owner1, from),
        op.eq(owner2, from),
        op.eq(owner3, from),
        op.eq(owner4, from),
    ]);
    err_msg = 'You must be the owner of all tokens.';
    method.addExecution(op.condition(condition, err_msg));

    // supply = supply + 1
    supply = op.add([ supply, '1' ]);
    update = op.write_universal('supply', output_id, supply);
    method.addExecution(update);

    // balance = balance + 1
    balance = op.add([ balance, '1' ]);
    update = op.write_universal(op.concat(['balance_', output_id]), from, balance);
    method.addExecution(update);

    return method;
}

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

function listToken(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ListToken",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "page", "type": "int", "maxlength": 5, "requirements": true});
    method.addParameter({"name": "count", "type": "int", "maxlength": 4, "requirements": true});

    let page = op.load_param('page');
    let count = op.load_param('count');

    page = op.sub([page, 1]);

    // return list
    let list = op.list_universal('owner', page, count);
    response = op.response(list);
    method.addExecution(response);

    return method;
}

function send(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Send",
        "version": "2",
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

function cancel(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Cancel",
        "version": "2",
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

function getOrder(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetOrder",
        "version": "3",
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