const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = fee;

function fee(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod();

    method.type('contract');
    method.name('Fee');
    method.version('2');
    method.space(_space);
    method.writer(SASEUL.Enc.ZERO_ADDRESS);

    let from = op.load_param('from');
    let weight = op.weight();

    let from_balance = op.read_universal('balance', from, '0');
    let multiplier = op.read_universal('multiplier', SASEUL.Enc.ZERO_ADDRESS, '1');
    let recycle_resource = op.read_local('recycle_resource', SASEUL.Enc.ZERO_ADDRESS, '0');

    let byte_fee = '1000000000';
    let fee = op.precise_mul(weight, byte_fee, 0);
    let condition = op.gte(from_balance, fee);
    let err_msg = op.concat(["Insufficient balance to pay the fee. (Fee: ", fee, ")"]);

    method.addCondition(op.legacy_condition(condition, err_msg));

    from_balance = op.sub([from_balance, fee]);
    method.addUpdate(op.write_universal('balance', from, from_balance));

    let recycled_fee = op.precise_div(fee, multiplier, 0);
    recycle_resource = op.add([recycle_resource, recycled_fee]);

    method.addUpdate(op.write_local('recycle_resource', SASEUL.Enc.ZERO_ADDRESS, recycle_resource));

    return method;
}