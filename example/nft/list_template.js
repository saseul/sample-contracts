const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = listTemplate;

function listTemplate(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ListTemplate",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "page", "type": "int", "maxlength": 5, "requirements": true});

    let page = op.load_param('page');
    page = op.sub([page, 1]);

    // return list
    let list = op.list_universal('template', page, 50);
    response = op.response(list);
    method.addExecution(response);

    return method;
}