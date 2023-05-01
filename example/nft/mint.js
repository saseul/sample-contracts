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

    method.addParameter({"name": "id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let template_id = op.load_param('id');
    let template = op.read_universal('template', template_id);

    let tx_hash = op.load_param('hash');
    let uuid = op.id_hash(tx_hash);

    // from === writer
    condition = op.eq(from, writer);
    err_msg = 'You are not the owner of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // template !== null
    condition = op.ne(template, null);
    err_msg = 'There is no template with that id.';
    method.addExecution(op.condition(condition, err_msg));

    // save token_info
    update = op.write_universal('info', uuid, template);
    method.addExecution(update);

    // save owner
    update = op.write_universal('owner', uuid, from);
    method.addExecution(update);

    return method;
}