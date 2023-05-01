const SASEUL = require('saseul');
const prompt = require('prompt-sync')();
const path = require("path");
const fs = require("fs");
const ConfigIniParser = require('config-ini-parser').ConfigIniParser;

const space = 'MY TOKEN';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async function () {
    console.log('Please enter the token name.');
    let name = prompt();

    console.log('Please enter the token symbol.');
    let symbol = prompt();

    console.log('Please enter the amount of tokens to be issued.');
    let amount = prompt();

    console.log('Please enter the number of decimal places for the token.');
    let decimal = parseInt(prompt());

    let root = path.dirname(__dirname);
    let _input = await fs.promises.readFile(root + "/saseul.ini-test", { encoding: "utf-8" });
    let parser = new ConfigIniParser();

    parser.parse(_input);

    let peer = parser.get("Network", "peers[]").replace(/^"(.*)"$/, '$1');

    SASEUL.Rpc.endpoint(peer);

    let json = await fs.promises.readFile(root + "/keypair.json", { encoding: "utf-8" });
    let keypair = JSON.parse(json);

    let cid = SASEUL.Enc.cid(keypair.address, space);
    let result;

    result = await SASEUL.Rpc.sendTransaction(SASEUL.Rpc.signedTransaction({
        "cid": cid,
        "type": "Mint",
        "name": name,
        "symbol": symbol,
        "amount": amount,
        "decimal": decimal,
    }, keypair.private_key));
    console.dir(result);

    if (result.code === 200) {
        await sleep(3000);

        result = await SASEUL.Rpc.request(SASEUL.Rpc.signedRequest({
            "cid": cid,
            "type": "GetInfo",
        }, keypair.private_key));
        console.dir(result);
    }
})();
