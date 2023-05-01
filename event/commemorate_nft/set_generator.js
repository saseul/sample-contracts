const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = setGenerator;

function setGenerator(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "SetGenerator",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "id1", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id2", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id3", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "id4", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "output_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let template_id1 = op.load_param('id1');
    let template_id2 = op.load_param('id2');
    let template_id3 = op.load_param('id3');
    let template_id4 = op.load_param('id4');
    let output_id = op.load_param('output_id');
    let template1 = op.read_universal('template', template_id1);
    let template2 = op.read_universal('template', template_id2);
    let template3 = op.read_universal('template', template_id3);
    let template4 = op.read_universal('template', template_id4);
    let output = op.read_universal('template', output_id);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // template1 !== null, ... output !== null
    condition = op.and([
        op.ne(template1, null),
        op.ne(template2, null),
        op.ne(template3, null),
        op.ne(template4, null),
        op.ne(output, null),
    ]);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // set generator
    let generator = {
        "input1": template_id1,
        "input2": template_id2,
        "input3": template_id3,
        "input4": template_id4,
        "output": output_id,
    };
    update = op.write_universal('generator', '00', generator);
    method.addExecution(update);

    return method;
}