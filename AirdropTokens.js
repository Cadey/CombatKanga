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

const fromAccount = "[walletId]"; // Sending wallet 
const accountSeed = "[walletSeed]"; // Seed of sending wallet
const currencyCode = "XYZ"; // Currency to send E.g XRP, xSPECTAR
const issuerAccount = "[walletId]"; // Issuer wallet, required if currency is NOT XRP
const memoText = "" // Memo for the transaction E.g July ambassador rewards
let amounts = [];

// Private methods
async function airdropTokens() {

    let client = await ckTools.getClientAsync('wss://xrplcluster.com');
    let results = [];
    
    addAmounts();
    try {

        for(let x = 0; x < amounts.length; x++) {
            var ledgerDetails = await ckTools.getLedgerDetails(client);
            let maxLedgerIndex = ledgerDetails.result.ledger_index + 15;
            results.push(await ckTools.airdropToken(client, amounts[x].account, amounts[x].amount, amounts[x].currencyCode, amounts[x].issuerAccount, fromAccount, accountSeed, maxLedgerIndex, memoText))
        }
    }
    catch(e){
        console.log(e);
    }

    // Write them to a file
    //await fs.writeFileSync('[Some://File/Path]', JSON.stringify(results, null, 2));

    process.exit(1);
}
function addAmount(account, amount, currencyCode, issuerAccount) {
    amounts.push({ account: account, amount: amount, currencyCode: currencyCode, issuerAccount: issuerAccount });
}
function addAmounts() {

    //addAmount("WALLET TO GET THE AIRDROP", [AMOUNT TO GET], currencyCode, issuerAccount);
    //
    //E.g
    //addAmount("rh5jzTCdMRCVjQ7LT6zucjezC47KATkAAA", 10000, currencyCode, issuerAccount);
    
}

// Init
airdropTokens();




