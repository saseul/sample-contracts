const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = send;

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