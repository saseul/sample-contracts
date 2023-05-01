const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = generate;

function generate(writer, space) {
    let condition, err_msg, update;
    let method = new SASEUL.SmartContract.Method({
        "type": "contract",
        "name": "Generate",
        "version": "2",
        "space": space,
        "writer": writer,
    });

    method.addParameter({"name": "uuid1", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid2", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid3", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});
    method.addParameter({"name": "uuid4", "type": "string", "maxlength": SASEUL.Enc.ID_HASH_SIZE, "requirements": true});

    let from = op.load_param('from');
    let generator = op.read_universal('generator', '00');

    let uuid1 = op.load_param('uuid1');
    let uuid2 = op.load_param('uuid2');
    let uuid3 = op.load_param('uuid3');
    let uuid4 = op.load_param('uuid4');

    let info1 = op.read_universal('info', uuid1);
    let info2 = op.read_universal('info', uuid2);
    let info3 = op.read_universal('info', uuid3);
    let info4 = op.read_universal('info', uuid4);

    let used1 = op.read_universal('generation_used', uuid1);
    let used2 = op.read_universal('generation_used', uuid2);
    let used3 = op.read_universal('generation_used', uuid3);
    let used4 = op.read_universal('generation_used', uuid4);

    let owner1 = op.read_universal('owner', uuid1);
    let owner2 = op.read_universal('owner', uuid2);
    let owner3 = op.read_universal('owner', uuid3);
    let owner4 = op.read_universal('owner', uuid4);

    let id1 = op.id_hash(op.get(info1, 'name'));
    let id2 = op.id_hash(op.get(info2, 'name'));
    let id3 = op.id_hash(op.get(info3, 'name'));
    let id4 = op.id_hash(op.get(info4, 'name'));

    let input_id1 = op.get(generator, 'input1');
    let input_id2 = op.get(generator, 'input2');
    let input_id3 = op.get(generator, 'input3');
    let input_id4 = op.get(generator, 'input4');
    let output_id = op.get(generator, 'output');

    let balance = op.read_universal(op.concat(['balance_', output_id]), from, '0');
    let supply = op.read_universal('supply', output_id, '0');

    // generator !== null
    condition = op.ne(generator, null);
    err_msg = 'There is no generator.';
    method.addExecution(op.condition(condition, err_msg));

    // id1 === input_id1, ...
    condition = op.and([
        op.eq(id1, input_id1),
        op.eq(id2, input_id2),
        op.eq(id3, input_id3),
        op.eq(id4, input_id4),
    ]);
    err_msg = 'The token does not satisfy the generator requirements.';
    method.addExecution(op.condition(condition, err_msg));

    // used1 === false, ...
    condition = op.and([
        op.eq(used1, false),
        op.eq(used2, false),
        op.eq(used3, false),
        op.eq(used4, false),
    ]);
    err_msg = 'All tokens must not have been used for generation.';
    method.addExecution(op.condition(condition, err_msg));

    // owner1 === from, ...
    condition = op.and([
        op.eq(owner1, from),
        op.eq(owner2, from),
        op.eq(owner3, from),
        op.eq(owner4, from),
    ]);
    err_msg = 'You must be the owner of all tokens.';
    method.addExecution(op.condition(condition, err_msg));

    // supply = supply + 1
    supply = op.add([ supply, '1' ]);
    update = op.write_universal('supply', output_id, supply);
    method.addExecution(update);

    // balance = balance + 1
    balance = op.add([ balance, '1' ]);
    update = op.write_universal(op.concat(['balance_', output_id]), from, balance);
    method.addExecution(update);

    return method;
}