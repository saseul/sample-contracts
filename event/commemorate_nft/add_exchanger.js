const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = addExchanger;

function addExchanger(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "AddExchanger",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "input_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "output_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let is_manager = op.read_universal('manager', from);

    let input_id = op.load_param('input_id');
    let output_id = op.load_param('output_id');
    let input = op.read_universal('template', input_id);
    let output = op.read_universal('template', output_id);

    // from === writer || is_manager === true
    condition = op.or([
        op.eq(from, writer), op.eq(is_manager, true),
    ]);
    err_msg = 'You are not the manager of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // input !== null, output !== null
    condition = op.and([
        op.ne(input, null),
        op.ne(output, null)
    ]);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // set exchanger
    update = op.write_universal('exchanger', output_id, input_id);
    method.addExecution(update);

    return method;
}