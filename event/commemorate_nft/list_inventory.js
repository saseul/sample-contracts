const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = listInventory;

function listInventory(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ListInventory",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "page", "type": "int", "maxlength": 5, "requirements": true});
    method.addParameter({"name": "count", "type": "int", "maxlength": 4, "requirements": true});

    let address = op.load_param('address');
    let page = op.load_param('page');
    let count = op.load_param('count');

    page = op.sub([page, 1]);

    // return list
    let list = op.list_universal(op.concat(['inventory_', address]), page, count);
    response = op.response(list);
    method.addExecution(response);

    return method;
}