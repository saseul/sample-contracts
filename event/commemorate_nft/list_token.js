const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = listToken;

function listToken(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ListToken",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "page", "type": "int", "maxlength": 5, "requirements": true});
    method.addParameter({"name": "count", "type": "int", "maxlength": 4, "requirements": true});

    let page = op.load_param('page');
    let count = op.load_param('count');

    page = op.sub([page, 1]);

    // return list
    let list = op.list_universal('owner', page, count);
    response = op.response(list);
    method.addExecution(response);

    return method;
}