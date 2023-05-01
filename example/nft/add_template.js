const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = addTemplate;

function addTemplate(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AddTemplate",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "name", "type": "string", "maxlength": 80, "requirements": true});
    method.addParameter({"name": "description", "type": "string", "maxlength": 2000, "requirements": false});
    method.addParameter({"name": "thumbnail", "type": "any", "maxlength": 4096, "requirements": false});
    method.addParameter({"name": "contents_type", "type": "string", "maxlength": 50, "requirements": true});
    method.addParameter({"name": "contents", "type": "any", "maxlength": 65536, "requirements": true});

    let from = op.load_param('from');

    let name = op.load_param('name');
    let description = op.load_param('description');
    let thumbnail = op.load_param('thumbnail');
    let contents_type = op.load_param('contents_type');
    let contents = op.load_param('contents');

    let template_id = op.id_hash(name);
    let existing_template = op.read_universal('template', template_id);

    // from === writer
    condition = op.eq(from, writer);
    err_msg = 'You are not the owner of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // existing_template === null
    condition = op.eq(existing_template, null);
    err_msg = 'The template already exists with the same name.';
    method.addExecution(op.condition(condition, err_msg));

    // save template
    update = op.write_universal('template', template_id, {
        "name": name,
        "description": description,
        "thumbnail": thumbnail,
        "contents_type": contents_type,
        "contents": contents
    });
    method.addExecution(update);

    return method;
}