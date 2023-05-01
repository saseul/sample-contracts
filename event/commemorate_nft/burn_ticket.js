const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = burnTicket;

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