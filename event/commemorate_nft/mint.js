const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = mint;

function mint(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Mint",
        "version": "4",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let template_id = op.load_param('id');
    let template = op.read_universal('template', template_id);

    let tx_hash = op.load_param('hash');
    let uuid = op.id_hash(tx_hash);

    let ticket_balance = op.read_universal(op.concat(['balance_', from]), template_id, '0');
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

    // save carved
    update = op.write_universal('carved', uuid, tx_hash);
    method.addExecution(update);

    // save inventory
    update = op.write_universal(op.concat(['inventory_', from]), uuid, true);
    method.addExecution(update);

    // ticket balance = ticket balance - 1
    ticket_balance = op.sub([ticket_balance, '1']);
    update = op.write_universal(op.concat(['balance_', from]), template_id, ticket_balance);
    method.addExecution(update);

    return method;
}