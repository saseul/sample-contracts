const SASEUL = require('saseul');
const path = require('path');
const fs = require('fs');

(async function () {
    let root = path.dirname(__dirname);
    let keypair = SASEUL.Sign.keyPair();
    let _output = JSON.stringify(keypair);
    await fs.promises.writeFile(root + "/keypair.json", _output);

    console.log('A new key pair has been successfully generated.');
    console.log('Key pair: ');
    console.dir(keypair);
})();