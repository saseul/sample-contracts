const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = revoke;

function revoke(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Revoke",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "address", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let address = op.load_param('address');
    let is_manager = op.read_universal('manager', address);

    // from === writer
    condition = op.eq(from, writer);
    err_msg = 'You are not the owner of the contract.';
    method.addExecution(op.condition(condition, err_msg));

    // is_manager === true
    condition = op.eq(is_manager, true);
    err_msg = 'The address does not have manager authorization.';
    method.addExecution(op.condition(condition, err_msg));

    // manager.address = false
    update = op.write_universal('manager', address, false);
    method.addExecution(update);

    return method;
}