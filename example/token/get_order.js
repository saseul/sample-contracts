const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getOrder;

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

    // response = existing_order
    response = op.response(existing_order);
    method.addExecution(response);

    return method;
}