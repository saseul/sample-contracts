const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = faucet;

function faucet(_space, _writer) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.LegacyMethod({
        "type": "contract",
        "name": "Faucet",
        "version": "2",
        "space": _space,
        "writer": SASEUL.Enc.ZERO_ADDRESS,
    });

    let from = op.load_param('from');
    let from_balance = op.read_universal('balance', from, '0');

    let amount = '30000000000000000000000';
    let maximum = '50000000000000000000000';

    // from_balance + amount < maximum
    condition = op.lt(op.add([from_balance, amount]), maximum);
    err_msg = "You can't get SL any more. ";
    method.addCondition(op.legacy_condition(condition, err_msg));

    // from_balance = from_balance + amount
    from_balance = op.add([ from_balance, amount ]);
    update = op.write_universal('balance', from, from_balance);
    method.addUpdate(update);

    return method;
}