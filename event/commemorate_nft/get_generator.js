const SASEUL = require('saseul');

let op = SASEUL.SmartContract.Operator;

module.exports = getGenerator;

function getGenerator(writer, space) {
    let response;
    let method = new SASEUL.SmartContract.Method({
        "type": "request",
        "name": "GetGenerator",
        "version": "1",
        "space": space,
        "writer": writer,
    });

    // return generator item
    let generator = op.read_universal('generator', '00', {});
    response = op.response(generator);
    method.addExecution(response);

    return method;
}