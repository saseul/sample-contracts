const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = refine;

function refine(_space, _writer) {
    let method = new SASEUL.SmartContract.LegacyMethod({
        "type": "contract",
        "name": "Refine",
        "version": "4",
        "space": _space,
        "writer": SASEUL.Enc.ZERO_ADDRESS,
    });

    method.addParameter({
        "name": "amount",
        "type": "string",
        "maxlength": 40,
        "requirements": true
    });

    let from = op.load_param('from');
    let amount = op.load_param('amount');

    let reduction_limit_default = '1000000000000000000000000000';
    let reduction = '0.84375';

    let reduction_limit = op.read_universal('reduction_limit', SASEUL.Enc.ZERO_ADDRESS, reduction_limit_default);
    let multiplier = op.read_universal('multiplier', SASEUL.Enc.ZERO_ADDRESS, '1');
    let season_supply = op.read_universal('season_supply', SASEUL.Enc.ZERO_ADDRESS, '0');
    let total_supply = op.read_universal('total_supply', SASEUL.Enc.ZERO_ADDRESS, '0');

    let from_resource = op.read_universal('resource', from, '0');
    let from_balance = op.read_universal('balance', from, '0');

    let refined_amount = op.precise_mul(amount, multiplier, 0);

    let next_multiplier = op.precise_mul(multiplier, reduction, 10);
    let min_condition = op.lt(next_multiplier, '0.0000001');
    next_multiplier = op.if(min_condition, '0.0000001', next_multiplier);

    let next_reduction_limit = op.precise_mul(reduction_limit_default, next_multiplier, 0);

    let condition, update, err_msg;

    condition = op.gt(amount, '0');
    err_msg = 'The amount to be refined must be greater than zero. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let scale = op.scale(amount);
    condition = op.eq(scale, '0');
    err_msg = 'The amount to be refined must be an integer. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gte(from_resource, amount);
    err_msg = 'The amount to be refined must be greater than or equal to the amount of resources you have. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    condition = op.gt(refined_amount, '0');
    err_msg = 'The refined amount must be greater than zero. ';
    method.addCondition(op.legacy_condition(condition, err_msg));

    let next_condition = op.gt(season_supply, reduction_limit);

    next_multiplier = op.if(next_condition, next_multiplier, multiplier);
    update = op.write_universal('multiplier', SASEUL.Enc.ZERO_ADDRESS, next_multiplier);
    method.addUpdate(update);

    next_reduction_limit = op.if(next_condition, next_reduction_limit, reduction_limit);
    update = op.write_universal('reduction_limit', SASEUL.Enc.ZERO_ADDRESS, next_reduction_limit);
    method.addUpdate(update);

    total_supply = op.add([total_supply, refined_amount]);
    update = op.write_universal('total_supply', SASEUL.Enc.ZERO_ADDRESS, total_supply);
    method.addUpdate(update);

    season_supply = op.add([season_supply, refined_amount]);
    season_supply = op.if(next_condition, '0', season_supply);
    update = op.write_universal('season_supply', SASEUL.Enc.ZERO_ADDRESS, season_supply);
    method.addUpdate(update);

    from_resource = op.sub([from_resource, amount]);
    update = op.write_universal('resource', from, from_resource);
    method.addUpdate(update);

    from_balance = op.add([from_balance, refined_amount]);
    update = op.write_universal('balance', from, from_balance);
    method.addUpdate(update);

    return method;
}