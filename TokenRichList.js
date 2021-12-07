//  Copyright 2021 KombatKanga Ltd (Company number 13709049)
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
//   _____                 _           _     _   __                                         _   
//  /  __ \               | |         | |   | | / /                                        | |  
//  | /  \/ ___  _ __ ___ | |__   __ _| |_  | |/ /  __ _ _ __   __ _  __ _        __ _ _ __| |_ 
//  | |    / _ \| '_ ` _ \| '_ \ / _` | __| |    \ / _` | '_ \ / _` |/ _` |      / _` | '__| __|
//  | \__/\ (_) | | | | | | |_) | (_| | |_  | |\  \ (_| | | | | (_| | (_| |  _  | (_| | |  | |_ 
//   \____/\___/|_| |_| |_|_.__/ \__,_|\__| \_| \_/\__,_|_| |_|\__, |\__,_| (_)  \__,_|_|   \__|
//                                                              __/ |                           
//                                                             |___/      
//     
//
//  A collection of useful functions to help navigate the XRPL (Ripple XRP SDK)  
//
//  If you want help using the XRPL.js libary or want us to add ant more functions
//  please get in contact with us at [[support@kombatkanga.art]]
//
//

// Private variables
var ckTools = require('./ckTools');
var fromExponential = require('from-exponential');

const currencyId = "784B616E67614D4B310000000000000000000000";
const issuer = "rPwdrA6YFGR6k5rPyT6QPx7MrQAavUtyz5";
const maxAccountsToShow = 10; // or max with Number.MAX_SAFE_INTEGER
const minBalance = 200;

// Private methods
async function tokenRichList() {

    let client = await ckTools.getClientAsync();
    let trustLines = await ckTools.getAllTrustLines(client, issuer, Number.MAX_SAFE_INTEGER, { amount: minBalance, currencyId: currencyId});

    trustLines.forEach((trustline) => trustline.balance = ckTools.toPositiveBalance(trustline.balance));
    trustLines = trustLines.sort((a, b) => b.balance - a.balance);

    trustLines.splice(0, maxAccountsToShow).forEach((trustline) => {
        console.log(`Wallet:  ${trustline.account} - Balance: ${trustline.balance}`)
    });

    process.exit(1);
}

// Init
tokenRichList();
