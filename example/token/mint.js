const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = mint;

function mint(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Mint",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "name", "type": "string", "maxlength": 80, "requirements": true});
    method.addParameter({"name": "symbol", "type": "string", "maxlength": 20, "requirements": true});
    method.addParameter({"name": "amount", "type": "string", "maxlength": 80, "requirements": true});
    method.addParameter({"name": "decimal", "type": "int", "maxlength": 2, "requirements": true});

    let from = op.load_param('from');
    let name = op.load_param('name');
    let symbol = op.load_param('symbol');
    let amount = op.load_param('amount');
    let decimal = op.load_param('decimal');

    let info = op.read_universal('info', '00');

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

    // decimal >= 0
    condition = op.gte(decimal, '0');
    err_msg = 'The decimal must be greater than or equal to 0.';
    method.addExecution(op.condition(condition, err_msg));

    // save info
    update = op.write_universal('info', '00', {
        "name": name,
        "symbol": symbol,
        "total_supply": amount,
        "decimal": decimal,
    });
    method.addExecution(update);

    // from balance = amount;
    update = op.write_universal('balance', from, amount);
    method.addExecution(update);

    return method;
}