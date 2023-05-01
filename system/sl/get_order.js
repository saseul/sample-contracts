const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getOrder;

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