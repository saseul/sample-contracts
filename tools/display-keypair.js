const path = require('path');
const fs = require('fs');

(async function () {
    let root = path.dirname(__dirname);
    let json = await fs.promises.readFile(root + "/keypair.json", { encoding: "utf-8" });
    let keypair = JSON.parse(json);

    console.dir(keypair);
})();