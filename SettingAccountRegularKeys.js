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
var ckTools = require('./ckTools');
const network_server = 'wss://s.altnet.rippletest.net:51233';

// Private methods
async function SettingAccountRegularKeys() {

    let client = await ckTools.getClientAsync(network_server);

    let mainAccount = await ckTools.generateWallet(client);
    let signingAccount = await ckTools.generateWallet(client);

    let receiverAccount = await ckTools.generateWallet(client);
   
    // Set the regular key
    await ckTools.setRegularKeyOnaccount(client, mainAccount, signingAccount);

    // This will send using the newly added Regular Key
    await ckTools.sendXrpToaccount(client, mainAccount, receiverAccount.address, 10, signingAccount.seed);

    // Remove the regular key
    await ckTools.removeRegularKeyOnaccount(client, mainAccount);

    // This will fail to send using the newly added Regular Key
    await ckTools.sendXrpToaccount(client, mainAccount, receiverAccount.address, 10, signingAccount.seed);

    process.exit(0);
}

// Init
SettingAccountRegularKeys();
