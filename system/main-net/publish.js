const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = publish;

function publish() {
    let method = new SASEUL.SmartContract.LegacyMethod();
    let op = SASEUL.SmartContract.Operator;

    method.type('contract');
    method.name('Publish');
    method.version('1');
    method.space(SASEUL.Enc.hash('Fiat lux. '));
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    method.addParameter({
        "name": "code",
        "type": "string",
        "maxlength": 65536,
        "requirements": true
    });

    let from = op.load_param('from');
    let code = op.load_param('code');

    let decoded_code = op.decode_json(code);

    let type = op.get(decoded_code, 't');
    let name = op.get(decoded_code, 'n');
    let space = op.get(decoded_code, 's');
    let version = op.get(decoded_code, 'v');
    let writer = op.get(decoded_code, 'w');

    let code_id = op.hash([ writer, space, name ]);

    let contract_info = op.read_local('contract', code_id);
    contract_info = op.decode_json(contract_info);

    let request_info = op.read_local('request', code_id);
    request_info = op.decode_json(request_info);

    let contract_version = op.get(contract_info, 'v');
    let request_version = op.get(request_info, 'v');

    let condition = op.eq(writer, from);
    let err_msg = 'Writer must be the same as the from address ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.is_string([type]);
    err_msg = op.concat(['Invalid type: ', type]);
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.in(type, ['contract', 'request']);
    err_msg = 'Type must be one of the following: contract, request ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.is_string([name]);
    err_msg = op.concat(['Invalid name: ', name]);
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.reg_match('/^[A-Za-z_0-9]+$/', name);
    err_msg = 'The name must consist of A-Za-z_0-9.';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.is_numeric([version]);
    err_msg = op.concat(['Invalid version: ', version]);
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.is_string([space]);
    err_msg = op.concat(['Invalid nonce: ', space]);
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.if(
        op.eq(type, 'contract'),
        op.gt(version, contract_version),
        op.if(
            op.eq(type, 'request'),
            op.gt(version, request_version),
            false
        )
    );

    err_msg = 'Only new versions of code can be registered.';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let update = op.if(
        op.eq(type, 'contract'),
        op.write_local('contract', code_id, code),
        op.if(
            op.eq(type, 'request'),
            op.write_local('request', code_id, code),
            false
        )
    );

    method.addUpdate(update);

    return method;
}