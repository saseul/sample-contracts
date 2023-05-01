const SASEUL = require('saseul');
const prompt = require('prompt-sync')();
const path = require('path');
const fs = require('fs');

(async function () {
    console.log('Please enter the private key to import. ');
    let private_key = prompt();

    if (!SASEUL.Sign.keyValidity(private_key)) {
        console.log('Invalid key: ' + private_key);
        return false;
    }

    let keypair = {
        "private_key": private_key,
        "public_key": SASEUL.Sign.publicKey(private_key),
        "address": SASEUL.Sign.address(SASEUL.Sign.publicKey(private_key))
    };

    let root = path.dirname(__dirname);
    let _output = JSON.stringify(keypair);
    await fs.promises.writeFile(root + "/keypair.json", _output);

    console.log('The key pair was imported successfully. ');
    console.log('Key pair: ');
    console.dir(keypair);
})();