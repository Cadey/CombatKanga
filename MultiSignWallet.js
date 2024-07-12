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

// Private methods
async function MultiSignWallet() {

    let client = await ckTools.getClientAsync(network_server);

    let mainAccount = await ckTools.generateWallet(client);
    let receiverAccount = await ckTools.generateWallet(client);

    let quorumNeeded = 4;
    let q1Weight = 1;
    let q2Weight = 2;

    let q2_wallet = await ckTools.generateWallet(client);
    let q1_walletA = await ckTools.generateWallet(client);
    let q1_walletB = await ckTools.generateWallet(client);
    let q1_walletC = await ckTools.generateWallet(client);

    // Set the regular key
    await ckTools.setAccountMultiSignerList(client, mainAccount, quorumNeeded, 
        [
            { address : q2_wallet.address, weight: q2Weight },
            { address : q1_walletA.address, weight: q1Weight },
            { address : q1_walletB.address, weight: q1Weight },
            { address : q1_walletC.address, weight: q1Weight },
        ]
    );

    // Send from the master still works
    await ckTools.sendXrpToaccount(client, mainAccount, receiverAccount.address, 10);


    var tx = {
        "TransactionType": "Payment",
        "Destination": receiverAccount.address,
        "Account": mainAccount.address,
        "Amount": `${ckTools.xrpl.xrpToDrops(10)}`
    };

    var signersCount = 3;
    var preparedTx = await ckTools.prepareTx(client, tx, signersCount);
    

    // Prepair sig1
    //var sig1Payload = Object.assign({}, preparedTx); //JSON.parse(JSON.stringify(preparedTx));
    //var sig2Payload = Object.assign({}, preparedTx);
    //var sig3Payload = Object.assign({}, preparedTx);

    var sig1 = ckTools.signFor(q2_wallet, preparedTx);
    var sig2 = ckTools.signFor(q1_walletA, preparedTx);
    var sig3 = ckTools.signFor(q1_walletC, preparedTx);

    // var t1 = Object.assign({}, preparedTx);
    // var t2 = Object.assign({}, preparedTx);
    // var t3 = Object.assign({}, preparedTx);
    // t1["Signers"] = { "Signer" : { "Account" : `${q2_wallet.address}`, "SigningPubKey" : q2_wallet.publicKey  ,  "TxnSignature" : sig1.tx_blob  } };
    // t2["Signers"] = { "Signer" : { "Account" : `${q1_walletA.address}`, "SigningPubKey" : q1_walletA.publicKey  ,  "TxnSignature" : sig2.tx_blob  } };
    // t3["Signers"] = { "Signer" : { "Account" : `${q1_walletC.address}`, "SigningPubKey" : q1_walletC.publicKey  ,  "TxnSignature" : sig3.tx_blob  } };

    // //var txes = [t1, t2, t3];
    // //var test = ckTools.xrpl.multisign(txes);

    // preparedTx["Signers"] = [
    //     { "Signer" : { "Account" : `${q2_wallet.address}`, "SigningPubKey" : q2_wallet.publicKey  ,  "TxnSignature" : sig1.tx_blob  } },
    //     { "Signer" : { "Account" : `${q1_walletA.address}`, "SigningPubKey" : q1_walletA.publicKey  ,  "TxnSignature" : sig2.tx_blob  } },
    //     { "Signer" : { "Account" : `${q1_walletC.address}`, "SigningPubKey" : q1_walletC.publicKey  ,  "TxnSignature" : sig3.tx_blob  } },
    // ]


    // try {
    //     var result = await client.submitAndWait(preparedTx);
    //     console.log(result);
    // }
    // catch (e) {
    //     console.log(`${e}`);
    //     return;
    // }

    process.exit(1);

}

// Init
MultiSignWallet();
