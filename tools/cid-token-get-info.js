const SASEUL = require('saseul');
const prompt = require('prompt-sync')();
const path = require("path");
const fs = require("fs");
const ConfigIniParser = require('config-ini-parser').ConfigIniParser;

(async function () {
    console.log('Please enter the cid.');
    let cid = prompt();

    let root = path.dirname(__dirname);
    let _input = await fs.promises.readFile(root + "/saseul.ini", { encoding: "utf-8" });
    let parser = new ConfigIniParser();

    parser.parse(_input);

    let peer = parser.get("Network", "peers[]").replace(/^"(.*)"$/, '$1');

    SASEUL.Rpc.endpoint(peer);

    let result;

    result = await SASEUL.Rpc.request(SASEUL.Rpc.signedRequest({
        "cid": cid,
        "type": "GetInfo",
    }));
    console.dir(result);
})();
