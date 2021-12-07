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

// Private variables - Dont change
const xrpl = require('xrpl');
const fromExponential = require('from-exponential');
const rippleTimeOffSet = 946684800;
const maxDate = new Date(8640000000000000);
const minDate = new Date(-8640000000000000);;

// Private variables - customise as required
const upperDecimalLimit = 0.99;
const lowerDecimalLimit = 0.001;

// Public methods
var isBalanceEnough = function(line, requireBalance, currencyId)  {
  return toPositiveBalance(line.balance) >= requireBalance && line.currency === currencyId;
}
var toPositiveBalance = function(balance) {

  if (balance >= 0)
    return balance;

  let positiveBalance = balance * -1;

  positiveBalance = fromExponential(parseFloat(positiveBalance));

  let decimal = positiveBalance.toString().split(".");

  // Round off silly numbers - See upperDecimalLimit & lowerDecimalLimit variables
  if (decimal.length > 1) {
    let decimalNum = fromExponential(parseFloat(`0.${decimal[1]}`));
    if (decimalNum >= upperDecimalLimit)
      positiveBalance = parseInt(decimal[0]) + 1;
    else if (decimalNum <= lowerDecimalLimit)
      positiveBalance = parseInt(decimal[0]);
  }

  return parseFloat(positiveBalance);

}
var getDateTimeFromRippleTime = function(rippleTime) {

  return new Date((rippleTimeOffSet + rippleTime) * 1000);

}

var getAllTrustLinesAsync = async function(client, issuer, limit = Number.MAX_SAFE_INTEGER, minBalance = {currencyId, amount}) {

  let useBalanceOk = checkMinBalance(minBalance);

  let getTrustLines = {
    "command": "account_lines",
    "account": issuer,
    "ledger_index": "validated",
    "limit": limit
  };

  let trustLines = [];
  await processAllMarkersAsync(client, getTrustLines, (batch) => {

    if (!useBalanceOk) {
      trustLines = trustLines.concat(batch.result.lines)
    }
    else {
      trustLines = trustLines.concat(batch.result.lines.filter(
        (line) => isBalanceEnough(line, minBalance.amount, minBalance.currencyId)
      ));
    }

    return true;

  });

  return trustLines;

}
var processAllMarkersAsync = async function(client, request, perBatch) {

  let scan = true;
  let marker = null;
  let logLine = `Command: ${request.command} -`;
  while(scan) {

    if (marker)
      request.marker = marker;

    let response = await client.request(request);
    scan = (response.result.marker != null);

    var keepScanning = perBatch(response);

    if (keepScanning && scan) {
      marker = response.result.marker;
      console.log(`${logLine} Processing next batch - ${getCommentForScanMarker(marker)}`)
    } else {
      scan = false;
      console.log(`${logLine} Finished processing batches`);
    }  
  }

}
var getWalletTransactionsAsync = async function (client, account, oldest) {

  let request = {
    "command": "account_tx",
    "account": account,
    "ledger_index_min": -1,
    "ledger_index_max": -1,
    "binary": false,
    "forward": false
  }
  let walletTransactions = [];
  let foundEnd

  await processAllMarkersAsync(client, request, (batch) => {

    let txs = batch.result.transactions;

    if (!oldest) 
    {
      walletTransactions.push(txs);
      return true;
    }

    let foundEnd = false;
    for (let tx of txs) {
      let txDate = getDateTimeFromRippleTime(tx.tx.date);
      if (txDate >= oldest) {
        walletTransactions.push(tx);
      }
      else {
        foundEnd = true;
        break;
      }
    }

    return !foundEnd;

  });

  return {
    account : account,
    transactions : walletTransactions
  }

}
var getWalletTrustLineInfoAsync = async function(account, transactions, issuer, currencyId) {

    let firstSet = maxDate;
    let firstRemoved = maxDate;
    let lastSet = minDate;
    let lastRemoved = minDate;

    let trustLinesSet = [];
    
    transactions.forEach((tx) => {
        
        if(tx.tx.TransactionType === "TrustSet" && tx.validated) {
            if (tx.tx.LimitAmount.issuer == issuer && tx.tx.LimitAmount.currency == currencyId) {

                let wasAdded = false;

                for(let node of tx.meta.AffectedNodes) {
                    if (node.hasOwnProperty("CreatedNode")) {
                        wasAdded = true;
                        break;     
                    }
                }

                let turstLineDate = getDateTimeFromRippleTime(tx.tx.date);
      
                if (wasAdded) {
                    if (turstLineDate < firstSet) firstSet = turstLineDate;
                    if (turstLineDate > lastSet) lastSet = turstLineDate
                } else {
                    if (turstLineDate < firstRemoved) firstRemoved = turstLineDate;
                    if (turstLineDate > lastRemoved) lastRemoved = turstLineDate
                }
                
                trustLinesSet.push({
                    "Added" : wasAdded,
                    "DateTime" : turstLineDate
                });

            }
        }

    });

    return {
        account : account,
        firstSet : firstSet != maxDate ? firstSet : null,
        lastSet : lastSet != minDate ? lastSet : null,
        firstRemoved :  firstRemoved != maxDate ? firstRemoved : null,
        lastRemoved : lastRemoved != minDate ? lastRemoved : null,
        history : trustLinesSet
    };

}

// Private methods
function checkMinBalance(minBalance = {currencyId, amount}) {

  if (minBalance)  {

    let amount = parseFloat(minBalance.amount);
    if (isNaN(amount))
      throw 'minBalance.amount has to be a valid number';

    if (!minBalance.currencyId || minBalance.currencyId === "")
      throw 'minBalance.currencyId is required to check the balance';

    return true;

  }

  return false;

}
function getCommentForScanMarker(marker) {
  return marker instanceof Object ? `ledger: ${marker.ledger}, seq: ${marker.seq}` : marker;
}

// Public module
module.exports = {
  xrpl: xrpl,
  maxDate: maxDate,
  minDate: minDate,
  getClientAsync: async function() {
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();
    return client;
  },
  getAllTrustLinesAsync : getAllTrustLinesAsync,
  isBalanceEnough : isBalanceEnough,
  processAllMarkersAsync : processAllMarkersAsync,
  toPositiveBalance : toPositiveBalance,
  getWalletTransactionsAsync : getWalletTransactionsAsync,
  getDateTimeFromRippleTime: getDateTimeFromRippleTime,
  getWalletTrustLineInfoAsync: getWalletTrustLineInfoAsync
};

