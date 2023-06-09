const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = createTicket;

function createTicket(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "CreateTicket",
        "version": "3",
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

    let balance = op.read_universal(op.concat(['balance_', to]), template_id, '0');
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
    update = op.write_universal(op.concat(['balance_', to]), template_id, balance);
    method.addExecution(update);

    return method;
}