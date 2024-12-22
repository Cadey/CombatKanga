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

const account = "[Wallet_R_Address]"
const oldest = Date.parse('01 Dec 2021 00:00:00 UTC'); // How far to look back
const topXAccounts = 10;



// Private methods
async function trackWalletPayments() {

    const client = await ckTools.getClientAsync("wss://xrpl.ws");
    const walletTransactions = await ckTools.getWalletTransactionsAsync(client, account, oldest);
    const payments = await ckTools.getInboundAndOutboundPayments(account, walletTransactions.transactions);

    const outPut = {
        totals: {
            outgoing: [],
            incomming: []
        },
        topAccounts: {
            outgoing: [],
            incomming: []
        },
        accounts: []
    };

    payments.forEach(payment => {

        aggregateTotals(outPut.totals.incomming, payment.incommingTotals);
        aggregateTotals(outPut.totals.outgoing, payment.outgoingTotals);
    
        outPut.accounts.push({
            account: payment.account,
            incommingTotals: [...payment.incommingTotals],
            outgoingTotals: [...payment.outgoingTotals]
        });

    });

    outPut.accounts.forEach(({ account, incommingTotals, outgoingTotals }) => {
        addToTopAccounts(outPut.topAccounts.incomming, incommingTotals, account, "incomming");
        addToTopAccounts(outPut.topAccounts.outgoing, outgoingTotals, account, "outgoing");
    });

    //await fs.writeFileSync('[Some://File/Path]', JSON.stringify(outPut), null, 2);

    process.exit(0);
}
function aggregateTotals(targetArray, newEntries) {

    newEntries.forEach(entry => {
        const currencyIndex = targetArray.findIndex(existing => existing.currency === entry.currency);
        if (currencyIndex === -1) {
            targetArray.push({...entry});
        } else {
            targetArray[currencyIndex].amount += entry.amount;
        }
    });

}
function addToTopAccounts(accountsMap, totals, account, type) {
    totals.forEach(({ currency, amount }) => {

        if (!accountsMap[currency]) {
            accountsMap[currency] = [];
        }

        var existing = accountsMap[currency].find(entry => entry.account === account);
        if (existing) {
            existing.totalAmount += amount;
        } else {
            accountsMap[currency].push({ account, totalAmount: amount });
        }

        accountsMap[currency].sort((a, b) => b.totalAmount - a.totalAmount);
        accountsMap[currency] = accountsMap[currency].slice(0, topXAccounts);
        
    });
}

// Init
trackWalletPayments();
