const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = takeTicket;

function takeTicket(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "TakeTicket",
        "version": "3",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "output_id", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let uuid = op.load_param('uuid');

    let info = op.read_universal('info', uuid);
    let used = op.read_universal('used', uuid);
    let owner = op.read_universal('owner', uuid);

    let input_id = op.id_hash(op.get(info, 'name'));
    let output_id = op.load_param('output_id');

    let exchanger = op.read_universal('exchanger', output_id);
    let balance = op.read_universal(op.concat(['balance_', from]), output_id, '0');
    let supply = op.read_universal('supply', output_id, '0');

    // exchanger !== null
    condition = op.ne(exchanger, null);
    err_msg = 'There is no exchanger.';
    method.addExecution(op.condition(condition, err_msg));

    // exchanger === input_id
    condition = op.eq(exchanger, input_id);
    err_msg = 'The token does not satisfy the exchanger requirements.';
    method.addExecution(op.condition(condition, err_msg));

    // used === false
    condition = op.eq(used, false);
    err_msg = 'All tokens must be in an unused state.';
    method.addExecution(op.condition(condition, err_msg));

    // owner === from
    condition = op.eq(owner, from);
    err_msg = 'You are not the owner of the token.';
    method.addExecution(op.condition(condition, err_msg));

    // supply = supply + 1
    supply = op.add([ supply, '1' ]);
    update = op.write_universal('supply', output_id, supply);
    method.addExecution(update);

    // balance = balance + 1
    balance = op.add([ balance, '1' ]);
    update = op.write_universal(op.concat(['balance_', from]), output_id, balance);
    method.addExecution(update);

    return method;
}