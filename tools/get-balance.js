const SASEUL = require('saseul');
const path = require("path");
const fs = require("fs");
const ConfigIniParser = require('config-ini-parser').ConfigIniParser;

(async function () {
    let root = path.dirname(__dirname);
    let _input = await fs.promises.readFile(root + "/saseul.ini", { encoding: "utf-8" });
    let parser = new ConfigIniParser();

    parser.parse(_input);

    let peer = parser.get("Network", "peers[]").replace(/^"(.*)"$/, '$1');

    SASEUL.Rpc.endpoint(peer);

    let json = await fs.promises.readFile(root + "/keypair.json", { encoding: "utf-8" });
    let keypair = JSON.parse(json);

    let result, balance;

    result = await SASEUL.Rpc.request(
        SASEUL.Rpc.signedRequest({
            "type": "GetBalance",
            "address": keypair.address
        }, keypair.private_key)
    );

    balance = result.data.balance;

    console.dir('Current Balance: ' + balance);
})();