//  Copyright 2024 CombatKanga Ltd (Company number 13709049)
//  
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//  
//      http://www.apache.org/licenses/LICENSE-2.0
//  
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
//
//
//   ______            _                _    _                                          
//  / _____)          | |          _   | |  / )                                         
// | /      ___  ____ | | _   ____| |_ | | / / ____ ____   ____  ____   ____ ___  ____  
// | |     / _ \|    \| || \ / _  |  _)| |< < / _  |  _ \ / _  |/ _  | / ___) _ \|    \ 
// | \____| |_| | | | | |_) | ( | | |__| | \ ( ( | | | | ( ( | ( ( | |( (__| |_| | | | |
//  \______)___/|_|_|_|____/ \_||_|\___)_|  \_)_||_|_| |_|\_|| |\_||_(_)____)___/|_|_|_|
//                                                       (_____|                        
//     
//  [Combatkanga.com]
//
//  A collection of useful functions to help navigate the XRPL (Ripple XRP SDK)  
//
//  If you want help using the XRPL.js libary or want us to add ant more functions
//  please get in contact with us at [[support@combatkanga.com]]
//
//

//Imports
const fs = require('fs');
var ckTools = require('./ckTools');

const network_server = 'wss://s.altnet.rippletest.net:51233';
const hot_wallet_seed = '[Wallet_R_Address]';
const cold_wallet_seed = '[Wallet_R_Address]';
const currency_code = '[Currency]';
const total_supply = 1000000000;
const total_wallets = 25;
const fund_xrp_amount = 500;
const fund_token_amount = 50000;

// Private methods
async function GenerateTokenAndDistribute() {

    let client = await ckTools.getClientAsync(network_server);

    // Create the Hot-Wallet, the wallet which will hold the new tokens to distribute
    let hotWallet = hot_wallet_seed ? ckTools.getWalletFromSeed(hot_wallet_seed) : await ckTools.generateWallet(client);
    console.log(`Hot wallet (receiver) created s:${hotWallet.seed} r:${hotWallet.address}`);

    // Create the Cold-Wallet, the wallet which will generate the new tokens by sending them to the Hot-Wallet
    let coldWallet = cold_wallet_seed ? ckTools.getWalletFromSeed(cold_wallet_seed) : await ckTools.generateWallet(client);
    console.log(`Cold wallet (issuer) created s:${coldWallet.seed} r:${coldWallet.address}`);

    // Update the cold wallet to allow ripping so tokens can be passed around between accounts.
    await ckTools.setupAccountAsIssuer(client, coldWallet);

    // Create Intial Trustline from Cold to Hot wallets
    await ckTools.createTrustLine(client, hotWallet, coldWallet.address, currency_code, total_supply);

    // Send the new tokens from the Cold wallet to the Hot wallet.
    await ckTools.sendTokensToWallet(client, coldWallet, hotWallet.address, coldWallet.address, currency_code, total_supply);

    var newWallets = [];
    
    // Generate a bunch of new wallets
    //
       newWallets = await ckTools.generateWallets(client, total_wallets, fund_xrp_amount);

    // Use wallets you already have seeds for.
    //
    //  for (const seed of ['seed1','seed2', '..etc..']) {
    //      newWallets.push(await ckTools.getWalletFromSeed(seed));
    //  }
    //

    let i = 0;
    while (i < newWallets.length) {

        // Funds the new wallet with the new token.
        await ckTools.createTrustLine(client, newWallets[i], coldWallet.address, currency_code, total_supply);
        await ckTools.sendTokensToWallet(client, hotWallet, newWallets[i].address, coldWallet.address, currency_code, fund_token_amount);
        i++;
    }

    process.exit(0);
}

// Init
GenerateTokenAndDistribute();
