const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = readTemplate;

function readTemplate(writer, space) {
    let condition, err_msg, response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "ReadTemplate",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let template_id = op.load_param('id');
    let template = op.read_universal('template', template_id);

    // template !== null
    condition = op.ne(template, null);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // return template
    response = op.response(template);
    method.addExecution(response);

    return method;
}