const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = send;

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