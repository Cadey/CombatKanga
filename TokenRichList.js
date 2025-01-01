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

// Private variables
var ckTools = require('./ckTools');
var fromExponential = require('from-exponential');
const fs = require('fs');

const currencyId = "[Wallet_R_Address]";
const issuer = "[Wallet_R_Address]";
const maxAccountsToShow = 100; // or max with Number.MAX_SAFE_INTEGER
const minBalance = 0.00000001;

// Private methods
async function tokenRichList() {

    // 1) Retrieve all trust lines
    let client = await ckTools.getClientAsync();
    let trustLines = await ckTools.getAllTrustLinesAsync(client, issuer, Number.MAX_SAFE_INTEGER, { amount: minBalance, currencyId: currencyId});
    
    // 2) Convert balances to positive numbers and sort descending
    trustLines.forEach((trustline) => trustline.balance = ckTools.toPositiveBalance(trustline.balance));
    trustLines = trustLines.sort((a, b) => b.balance - a.balance);

    //    NOTE:    Steps 3, 5 & 6 are optional for exporting results to file instead of in terminal only.
    //             If you just want to see the results in the terminal, comment them out or delete them.
    //    3) Limit to the top `maxAccountsToShow` 
    //    using `.slice()` here so we don't mutate `trustLines`.
    const topTrustLines = trustLines.slice(0, maxAccountsToShow);

    // 4) Log the results in the terminal
    trustLines.splice(0, maxAccountsToShow).forEach((trustline) => {
        console.log(`Wallet:  ${trustline.account} - Balance: ${trustline.balance}`)
    });

    // 5) Transform the results into JSON arrays in the following format:
    // [{ 
    //    Wallet: "rABC...", 
    //    Balance: 123 
    // }, ...]
    const formattedData = topTrustLines.map((trustline) => ({
        Wallet: trustline.account,
        Balance: trustline.balance
      }));

    // 6) Write the results to a JSON file. 
    // Make sure to change [Some://File/Path] to your desired file name!
    fs.writeFileSync('[Some://File/Path]', JSON.stringify(formattedData, null, 2));

    process.exit(0);
}

// Init
tokenRichList();
