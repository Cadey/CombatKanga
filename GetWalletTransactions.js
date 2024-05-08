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

const account = "[WalletId]"; // walletId
const oldest = Date.parse('01 Dec 2021 00:00:00 UTC'); // How far to look back

// Private methods
async function getWalletTransactions() {

    let client = await ckTools.getClientAsync();
    let walletTransactions = await ckTools.getWalletTransactionsAsync(client, account, oldest);

    // Write them to a file
    //await fs.writeFileSync('[Some://File/Path]', JSON.stringify(walletTransactions, null, 2));

    process.exit(1);
}

// Init
getWalletTransactions();
