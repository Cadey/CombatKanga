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

const tt_trustSet = "TrustSet";
const tt_payment = "Payment";
const tt_offerCreate = "OfferCreate";

const lt_rippleState = "RippleState";

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

  positiveBalance = parseXrpAmountToFloat(positiveBalance);

  let decimal = positiveBalance.toString().split(".");

  // Round off silly numbers - See upperDecimalLimit & lowerDecimalLimit variables
  if (decimal.length > 1) {
    let decimalNum = parseXrpAmountToFloat(parseFloat(`0.${decimal[1]}`));
    if (decimalNum >= upperDecimalLimit)
      positiveBalance = parseInt(decimal[0]) + 1;
    else if (decimalNum <= lowerDecimalLimit)
      positiveBalance = parseInt(decimal[0]);
  }

  return parseFloat(positiveBalance);

}
var parseXrpAmountToFloat = function(amount) { return parseFloat(fromExponential(parseFloat(amount))); }
var getDateTimeFromRippleTime = function(rippleTime) {

  return new Date((rippleTimeOffSet + rippleTime) * 1000);

}
var getWalletTradingStats = function(account, accountTx, currencyId, issuer, currentBalance) {

  let totalPurchased = 0;
  let totalSold = 0;
  let balancePeak = 0;
  let runningBalance = 0;
  let totalReceived = 0;
  let totalSent = 0;
  let firstTrustLineSet = maxDate;

  accountTx.transactions.reverse();
  accountTx.transactions.forEach(function (transaction) {

    // Discard non validated transactions
    if(!transaction.validated)
      return;

    let tx = transaction.tx;

    // Discard anything which isnt a trustline, payment or offer
    if(!(tx.TransactionType === tt_trustSet || tx.TransactionType === tt_payment || tx.TransactionType === tt_offerCreate))
      return;

    // Get the oldest trust line date.
    if(tx.TransactionType === tt_trustSet) {

      if (!issuer)
        return;

      let trustLineDate = getTrustLineDate(transaction.meta.AffectedNodes, tx.date, issuer);

      if (trustLineDate < firstTrustLineSet)
        firstTrustLineSet = trustLineDate;

      return;

    }

    // Discard transactions on other currency pairs
    if (tx.TransactionType === tt_payment && tx.Amount.currency != currencyId)
      return;

    if (tx.TransactionType === tt_offerCreate && !(tx.TakerPays.currency === currencyId || tx.TakerGets.currency === currencyId))
      return;

    // Process the balance change
    let change = getTransactionBalanceChange(transaction.meta.AffectedNodes, account);

    if (tx.TransactionType === tt_payment) {
      totalReceived += change.totalAdded;
      totalSent += change.totalRemoved * -1;
    }
    else
    {
      totalPurchased += change.totalAdded;
      totalSold += change.totalRemoved * -1;
    }
    
    runningBalance += change.totalAdded + change.totalRemoved;

    if (runningBalance > balancePeak)
      balancePeak = runningBalance;

  });

  var response = {
    account : account,
    currency : {
      currency: currencyId,
      symbol: getCurrencySymbol(currencyId)
    },
    runningBalance : runningBalance,
    balancePeak : balancePeak,
    totalPurchased : totalPurchased,
    totalSold : totalSold,
    totalReceived : totalReceived,
    totalSent: totalSent,
    firstTrustLineSet : firstTrustLineSet
  };

  if (currentBalance)
    response["currentBalance"] = (currentBalance < 0) ? toPositiveBalance(currentBalance) : currentBalance;

  return response;

}
var getWalletTrustLineInfo = function(account, transactions, issuer, currencyId) {

  let firstSet = maxDate;
  let firstRemoved = maxDate;
  let lastSet = minDate;
  let lastRemoved = minDate;

  let trustLinesSet = [];
  
  transactions.forEach((tx) => {
      
      if(tx.tx.TransactionType === tt_trustSet && tx.validated) {
          if (tx.tx.LimitAmount.issuer == issuer && tx.tx.LimitAmount.currency == currencyId) {

              let wasAdded = false;

              for(let node of tx.meta.AffectedNodes) {
                  if (node.hasOwnProperty("CreatedNode")) {
                      wasAdded = true;
                      break;     
                  }
              }

              let trustLineDate = getDateTimeFromRippleTime(tx.tx.date);
    
              if (wasAdded) {
                  if (trustLineDate < firstSet) firstSet = trustLineDate;
                  if (trustLineDate > lastSet) lastSet = trustLineDate
              } else {
                  if (trustLineDate < firstRemoved) firstRemoved = trustLineDate;
                  if (trustLineDate > lastRemoved) lastRemoved = trustLineDate
              }
              
              trustLinesSet.push({
                  "Added" : wasAdded,
                  "DateTime" : trustLineDate
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
var getAccountCurrenciesAsync = async function(client, account) {


  let getCurrencies = {
    "command": "account_currencies",
    "account": account,
    "ledger_index": "validated"
  };

  let currencies = [];
  await processAllMarkersAsync(client, getCurrencies, (batch) => {

    currencies= currencies.concat(batch.result.send_currencies);

    return true;

  });

  return currencies;

}
var getAccountLinessAsync = async function(client, account) {

  let getLines = {
    "command": "account_lines",
    "account": account,
    "ledger_index": "validated",
    "limit" : 40
  };

  let balances = [];
  await processAllMarkersAsync(client, getLines, (batch) => {

    batch.result.lines.forEach(e => {
      balances.push({
        issuer: e.account,
        currencyId: e.currency,
        symbol: getCurrencySymbol(e.currency),
        balance: e.balance,
      });
    })
    

    return true;

  });

  return balances;

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
function getTransactionBalanceChange(affectedNodes, walletId)  {

  let totalAdded = 0;
  let totalRemoved = 0;

  affectedNodes.forEach(function (node) {

    let modNode = node.ModifiedNode;
    if (!modNode || !modNode.LedgerEntryType)
      return;

    if (modNode.LedgerEntryType == lt_rippleState) {
  
      if (modNode.FinalFields.LowLimit.issuer == walletId)
      {

        let prevBalance = parseXrpAmountToFloat(modNode.PreviousFields.Balance.value);
        let newBalance = parseXrpAmountToFloat(modNode.FinalFields.Balance.value);
        let balanceChange = newBalance - prevBalance;

        if (balanceChange > 0)
          totalAdded += balanceChange;
        else
          totalRemoved += balanceChange;

      }

    };

  });

  return {
    totalAdded : totalAdded,
    totalRemoved : totalRemoved
  };

}
function getCurrencySymbol(currency) {

  if (currency.length == 3)
    return currency;

  let symbol = "";

  for (var i = 0; i < currency.length; i += 2)
    symbol += String.fromCharCode(parseInt(currency.substr(i, 2), 16));

  return symbol;

}
function getTrustLineDate(AffectedNodes, txDate, issuer) {

  let trustLineDate = new Date(8640000000000000);

  AffectedNodes.forEach(function (node) {

    if (node.CreatedNode?.NewFields?.HighLimit?.issuer == issuer)
      trustLineDate = getDateTimeFromRippleTime(txDate);

  });

  return trustLineDate;

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
  getAccountCurrenciesAsync: getAccountCurrenciesAsync,
  getAccountLinessAsync: getAccountLinessAsync,
  getAccountBalancesAsync: getAccountLinessAsync,
  getDateTimeFromRippleTime: getDateTimeFromRippleTime,
  getWalletTrustLineInfo: getWalletTrustLineInfo,
  getWalletTradingStats: getWalletTradingStats
};

