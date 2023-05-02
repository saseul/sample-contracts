# Sample Contracts

## Overview

We are releasing sample contracts that can be used on the SASEUL network. 

Please refer to the link below:

- Block Explorer (Test-net): https://explorer.saseul.com/test-net.html
- Documentation: https://docs.saseul.com/

## Usage

You can issue your own tokens by running the script under 'tools'.

Please install [node.js](https://nodejs.org/) to run the script.

```shell
$ npm install

$ node ./tools/generate-keypair
$ node ./tools/faucet

$ node ./tools/publish-token-contracts
$ node ./tools/token-mint

Please enter the token name.
<token name>
Please enter the token symbol.
<token symbol>
Please enter the amount of tokens to be issued.
<amount>
Please enter the number of decimal places for the token.
<decimal (If no decimals, enter 0.)>
```

You can check the issued contract on the [test-net block explorer.](https://explorer.saseul.com/test-net.html?ic=ct&ia=list)

If fewer than 8 methods have been deployed, please run 'publish-token-contracts' again.

To check your balance after running the faucet, use the 'get-balance' script.

```shell
$ node ./tools/get-balance
```

To check the information and balance of issued tokens, use the 'token-get-info' and 'token-get-balance' scripts.

```shell
$ node ./tools/token-get-info
$ node ./tools/token-get-balance
```

If you want to send tokens to another person, use the 'token-send' script.

```shell
$ node ./tools/token-send

Please enter the address to send the token to.
<to address>
How much would you like to send?
<amount>

$ node ./tools/token-get-balance
```

You can import a previously used key pair using the 'import-keypair' script.

Additionally, you can view information about the currently set key pair using the 'display-keypair' script.

```shell
$ node ./tools/import-keypair

Please enter the private key to import. 
<private_key>

$ node ./tools/display-keypair
```

Each script refers to the saseul.ini file, and the default setting is saseul.ini-test.