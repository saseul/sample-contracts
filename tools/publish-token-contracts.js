const SASEUL = require('saseul');
const path = require("path");
const fs = require("fs");
const ConfigIniParser = require('config-ini-parser').ConfigIniParser;

const token = require("../example/token/all");
const space = 'MY TOKEN';

(async function () {
    let root = path.dirname(__dirname);
    let _input = await fs.promises.readFile(root + "/saseul.ini-test", { encoding: "utf-8" });
    let parser = new ConfigIniParser();

    parser.parse(_input);

    let peer = parser.get("Network", "peers[]").replace(/^"(.*)"$/, '$1');

    SASEUL.Rpc.endpoint(peer);

    let json = await fs.promises.readFile(root + "/keypair.json", { encoding: "utf-8" });
    let keypair = JSON.parse(json);

    let contract = new SASEUL.SmartContract.Contract(keypair.address, space);

    contract.addMethod(token.mint(keypair.address, space));
    contract.addMethod(token.getInfo(keypair.address, space));
    contract.addMethod(token.send(keypair.address, space));
    contract.addMethod(token.getBalance(keypair.address, space));
    contract.addMethod(token.deposit(keypair.address, space));
    contract.addMethod(token.approve(keypair.address, space));
    contract.addMethod(token.cancel(keypair.address, space));
    contract.addMethod(token.getOrder(keypair.address, space));

    contract.publish(keypair.private_key);
})();
