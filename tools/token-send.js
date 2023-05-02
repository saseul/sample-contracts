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
    let root = path.dirname(__dirname);
    let _input = await fs.promises.readFile(root + "/saseul.ini", { encoding: "utf-8" });
    let parser = new ConfigIniParser();

    parser.parse(_input);

    let peer = parser.get("Network", "peers[]").replace(/^"(.*)"$/, '$1');

    SASEUL.Rpc.endpoint(peer);

    let json = await fs.promises.readFile(root + "/keypair.json", { encoding: "utf-8" });
    let keypair = JSON.parse(json);

    let cid = SASEUL.Enc.cid(keypair.address, space);
    let result;

    result = await SASEUL.Rpc.request(
        SASEUL.Rpc.signedRequest({
            "cid": cid,
            "type": "GetBalance",
            "address": keypair.address
        }, keypair.private_key)
    );

    console.dir('Current Balance: ' + result.data.balance);
    console.log('Please enter the address to send the token to.');
    let to = prompt();

    console.log('How much would you like to send?');
    let amount = prompt();

    result = await SASEUL.Rpc.broadcastTransaction(
        SASEUL.Rpc.signedTransaction({
            "cid": cid,
            "type": "Send",
            "to": to,
            "amount": amount,
        }, keypair.private_key)
    );
    console.dir(result);

    if (result.code === 200) {
        await sleep(3000);

        result = await SASEUL.Rpc.request(
            SASEUL.Rpc.signedRequest({
                "cid": cid,
                "type": "GetBalance",
                "address": keypair.address
            }, keypair.private_key)
        );

        console.dir('Current Balance: ' + result.data.balance);
    }
})();
