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


// Private variables - Dont change
const xrpl = require('xrpl');
const fromExponential = require('from-exponential');
const { isNumber } = require('mathjs');
const rippleTimeOffSet = 946684800;
const maxDate = new Date(8640000000000000);
const minDate = new Date(-8640000000000000);;

const tt_trustSet = "TrustSet";
const tt_payment = "Payment";
const tt_offerCreate = "OfferCreate";

const lt_rippleState = "RippleState";

const convert = (from, to) => str => Buffer.from(str, from).toString(to).toUpperCase()
const utf8ToHex = convert('utf8', 'hex')
const hexToUtf8 = convert('hex', 'utf8')

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

var getAllTrustLinesAsync = async function(client, issuer, limit = 200, minBalance) {

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
var getAllCurrentNftsAsync = async function(client, issuer, limit = Number.MAX_SAFE_INTEGER) {

  let getWalletNfts = {
    "command": "account_nfts",
    "account": issuer,
    "ledger_index": "validated",
    "limit": limit
  };

  let NFTokens = [];
  await processAllMarkersAsync(client, getWalletNfts, (batch) => {

    NFTokens = NFTokens.concat(batch.result.account_nfts)

    return true;

  });

  return NFTokens;

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

var getIssuedNftIdsFromWallet = async function(client, issuer, oldest) {

  let walletTransactions = await getWalletTransactionsAsync(client, issuer, oldest);

  let txDetails = [];
  walletTransactions.transactions.forEach(tx => {
    if (tx.tx.TransactionType =="NFTokenMint" && tx.meta.TransactionResult == "tesSUCCESS"){
        txDetails.push({hash: tx.tx.hash, uri : tx.tx.URI});
    } 
  });

  let tokens = [];
  let totalNfts = txDetails.length;
  for(let x = 0; x < totalNfts; x++) {

    let result = await getTx(client, txDetails[x].hash);
    
    var oldIds = [];
    var changedIds = [];

    console.log(`Processing ${x} of ${totalNfts} nft's`)
    result.result.meta.AffectedNodes.forEach(node => {

        if (node.ModifiedNode != null && node.ModifiedNode.LedgerEntryType == "NFTokenPage")
        {
            if (node.ModifiedNode.PreviousFields.NFTokens && node.ModifiedNode.PreviousFields.NFTokens.length > 0) {
              oldIds = oldIds.concat(node.ModifiedNode.PreviousFields.NFTokens.map(e => e.NFToken.NFTokenID));
              changedIds = changedIds.concat(node.ModifiedNode.FinalFields.NFTokens.map(e => e.NFToken.NFTokenID));
            }
        }
        else if (node.CreatedNode != null && node.CreatedNode.LedgerEntryType == "NFTokenPage")
        {
            changedIds = changedIds.concat(node.CreatedNode.NewFields.NFTokens.map(e => e.NFToken.NFTokenID));
        }

    });

    var tokenId = changedIds.filter(e => !oldIds.includes(e))[0];
    tokens.push({tokenId: tokenId, uri: hexToUtf8(txDetails[x].uri)});
  }

  return tokens;

}

var getTx = async function (client, txHash) {

  let request = {
    "command": "tx",
    "transaction": txHash,
    "binary": false
  }

  let response = await client.request(request);
  return response;

}

var getNftInfo = async function (client, tokenId) {

  let request = {
    "command": "nft_info",
    "nft_id": tokenId
  }

  let response = await client.request(request);
  return response;

}

var findAndCancelExpiredNftOffers = async function (client, account, oldest, accountSeed, cancelBatchSize) {

    cancelBatchSize = cancelBatchSize ?? 25;

    let results = [];
    let walletTransactions = await getWalletTransactionsAsync(client, account, oldest);
    let expiredTokenOfferIds = [];
    let handeledOfferIds =[];

    walletTransactions.transactions.forEach(t => {
        if (t.tx.TransactionType === "NFTokenCreateOffer") {

            if (t.tx.Expiration < ((new Date().getTime() - rippleTime()) / 1000)) {
                var offerId = t.meta.AffectedNodes.filter(e => e.CreatedNode?.LedgerEntryType== "NFTokenOffer")[0]?.CreatedNode.LedgerIndex ?? false;

                if (offerId){
                    expiredTokenOfferIds.push(offerId);
                }
            }
        }
        else if (t.tx.TransactionType === "NFTokenAcceptOffer" || t.tx.TransactionType === "NFTokenCancelOffer") {

            if (t.tx.NFTokenOffers) {
                handeledOfferIds = handeledOfferIds.concat(t.tx.NFTokenOffers);
            } else {
                handeledOfferIds.push(t.tx.NFTokenSellOffer);
            }

        }
    });

    let activeExpiredTokenOfferIds = expiredTokenOfferIds.filter(e => !handeledOfferIds.includes(e));
    let totalItems = activeExpiredTokenOfferIds.length;
    for(let x = 0; x < (totalItems+cancelBatchSize) / cancelBatchSize; x++) {

        let offersToCancel = [];
        let getIds = true;
        while(getIds) {
            let id = activeExpiredTokenOfferIds.pop();
            if (!id){
                break;
            }
            offersToCancel.push(id);
            getIds = offersToCancel.length < cancelBatchSize;
        }
        
        if (offersToCancel.length > 0){
            console.log(`Canceling offers ${offersToCancel.join(', ')}`);
            let cancelResult = await cancelNftOffer(client, account, offersToCancel, accountSeed);
            results.push(cancelResult);
            console.log(`Result ${cancelResult}`);
        }
    }

    return results;

}

var cancelNftOffer = async function(client, account, offerIds, seed) {

  let request = {
    "TransactionType": "NFTokenCancelOffer",
    "Account": account,
    "NFTokenOffers": offerIds
  }

  return await sendSignedPayload(client, seed, request);

}

var createNftCollection = async function(client, issuer, seed, taxon, transferFee, flags, metadataUriArray) {


  let results = [];
  let tokenIds = [];

  for(var x = 0; x < metadataUriArray.length; x++) {

    try {

      let request = {
        "TransactionType": `NFTokenMint`,
        "Account": `${issuer}`,
        "URI": `${utf8ToHex(metadataUriArray[x])}`,
        "Flags": flags,
        "NFTokenTaxon": taxon,
        "TransferFee": transferFee
      }

      console.log(`Minting ${metadataUriArray[x]}`);
      var result = await sendSignedPayload(client, seed, request);

      var tokenId = "no-created";
      var oldIds = [];
      var changedIds = [];
      result.result.meta.AffectedNodes.forEach(node => {
        if (node.ModifiedNode != null && node.ModifiedNode.LedgerEntryType == "NFTokenPage")
          {
          
              if (node.ModifiedNode.PreviousFields.NFTokens.length > 0)
              {
                  oldIds.push(...node.ModifiedNode.PreviousFields.NFTokens.map(e => e.NFToken.NFTokenID));
                  changedIds.push(...node.ModifiedNode.FinalFields.NFTokens.map(e => e.NFToken.NFTokenID));
              }
          
          }
          else if (node.CreatedNode != null && node.CreatedNode.LedgerEntryType == "NFTokenPage")
          {
            changedIds.push(...node.CreatedNode.NewFields.NFTokens.map(e => e.NFToken.NFTokenID));
          }
                                  
      })
      tokenId = changedIds.filter(e => !oldIds.includes(e))[0];
      console.log(`Minted NFT ${metadataUriArray[x]} as : ${tokenId}`);

      results.push(result);
      tokenIds.push(tokenId);

    }
    catch (e) {
      console.log(`Failed to mint ${metadataUriArray[x]}`);
      console.log(`${e}`);
    }
    

  }

  return {results, tokenIds};

}
var createNftOffer = async function(client, account, seed, destinationWalletAddress, tokenId, amount, currencyCode, currencyIssuerAccount, expiredInSeconds, isSell, memoNote, ownerWalletAddress) {

  let expiredTime = "";

  if (expiredInSeconds != null) {
      //expiredTime = (new Date().getTime() - rippleTime()) + (expiredInSeconds * 1000)
  }

  let amountStr;
    if (currencyCode == "xrp") {
      amountStr = `${XrpBalanceToDrops(amount)}`;
    } else {

      var code = parseCurrencyCode(currencyCode);
      
      amountStr = {
                "currency": `${code}`, 
                "issuer": currencyIssuerAccount,
                "value": `${amount}`
            };
    }

  let request = {
    "TransactionType": "NFTokenCreateOffer",
    "Account": `${account}`,
    "NFTokenID": `${tokenId}`,
    "Amount": amountStr,
    "Flags": (isSell ? 1 : 0),
    "Memos": [
        {
            "Memo": {
                "MemoType": `${utf8ToHex("Note")}`,
                "MemoData": `${utf8ToHex(memoNote)}`
            }
        }
    ]
  };

  if (expiredTime) {
    request["Expiration"] = expiredTime;
  }
  if (destinationWalletAddress) {
    request["Destination"] = destinationWalletAddress;
  }
  if (ownerWalletAddress) {
    request["Owner"] = ownerWalletAddress;
  }
  
  var result = await sendSignedPayload(client, seed, request);

  var offerId = '';
  var offerResult = await getTx(client, result.result.hash);
  offerResult.result.meta.AffectedNodes.forEach(node => {
    if (node.CreatedNode != null && node.CreatedNode.LedgerEntryType == "NFTokenOffer")
      {
          offerId = node.CreatedNode.LedgerIndex;
      }
  });
  
  console.log(`Created NFTokenCreateOffer, Offer Id :${offerId}`);
  return {result, offerId}

}
var acceptNftOffer = async function(client, account, seed, buyOfferId, sellOfferId, brokerFeeInXrp, memo) {

  let request = {
    "TransactionType": "NFTokenAcceptOffer",
    "Account": `${account}`,
    "Memos" : [
        {
            "Memo" : {
                "MemoType": `${utf8ToHex("Note")}`,
                "MemoData": `${utf8ToHex(memo)}`
            }
        }
      ]
    };

    if (sellOfferId) {
      request["NFTokenSellOffer"] = sellOfferId
    }
    if (buyOfferId) {
      request["NFTokenBuyOffer"] = buyOfferId
    }
    if (brokerFeeInXrp) {
      request["NFTokenBrokerFee"] = buyOfferId
    }

    var result = await sendSignedPayload(client, seed, request);
    console.log(`Accepted NFTokenCreateOffer with NFTokenAcceptOffer, hash :${result.result.hash} - Result ${result.result.meta.TransactionResult}`);

    return result;

}


var airdropToken = async function(client, toAccount, amount, currencyCode, issuerAccount, fromAccount, fromAccountSeed, maxSequenceNumber, memoText = "", feeInDrops = 12) {

    let memo;
    if (memoText && memoText != "") {
      memo = {
        "Memo": {
          "MemoType": `${utf8ToHex("Note")}`,
          "MemoData": `${utf8ToHex(memoText)}`
        }
      }
    }
  
    let amountStr;
    if (currencyCode == "xrp") {
      amountStr = amount.XrpBalanceToDrops().ToString();
    } else {

      var code = parseCurrencyCode(currencyCode);
      
      amountStr = {
                "currency": `${code}`, 
                "issuer": issuerAccount,
                "value": `${amount}`
            };
    }
  
    let request = {
      "TransactionType": "Payment",
      "Destination": toAccount,
      "Account": fromAccount,
      "Amount": amountStr,
      "LastLedgerSequence" : maxSequenceNumber,
      "Fee" : `${feeInDrops}`,
    }
  
    if (memo) {
      request["Memos"] = [memo]
    }
  
    return await sendSignedPayload(client, fromAccountSeed, request);

}

var getLedgerDetails = async function (client) {

  let tx = {
    "command": "ledger",
    "ledger_index": "validated",
    "full": false,
    "accounts": false,
    "transactions": false,
    "expand": false,
    "owner_funds": false
  };

  return await client.request(tx);

}
var sendSignedPayload = async function(client, seed, payload) {

  let wallet = xrpl.Wallet.fromSecret(seed);


  if (!payload.Memos)  {
    payload["Memos"] = [];
  }
  payload.Memos.push(
    {
      "Memo": {
        "MemoType": `${utf8ToHex("Note")}`,
        "MemoData": `${utf8ToHex("Created with ckTools @ https://github.com/Cadey/CombatKanga")}`
      }
    }
  )

  const prepared = await client.autofill(payload);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob)

  return result;

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


var setupAccountAsIssuer = async function(client, wallet) {

  const cold_settings_tx = {
    "TransactionType": "AccountSet",
    "Account": wallet.address,
    "TransferRate": 0,
    "TickSize": 5,
    "SetFlag": xrpl.AccountSetAsfFlags.asfDefaultRipple
  }

  try {

    let result = await sendSignedPayload(client, wallet.seed, cold_settings_tx);

    if (result.result.meta.TransactionResult != "tesSUCCESS") {
      console.log(`Could not update account settings`);
    } else {
      console.log(`Cold wallet (issuer account) settings changed`);
    }

    return result;

  }
  catch (e) {
      console.log(`${e}`);
      return;
  }

}
var createTrustLine = async function(client, wallet, issuerAccount, currencyCode, totalFor) {

  let currency_code_hex = parseCurrencyCode(currencyCode);

  if (isNumber(totalFor)) {
    totalFor = `${totalFor}`;
  }

  var wallet_trust_set_tx = {
      "TransactionType": "TrustSet",
      "Account": wallet.address,
      "Flags": 131072,
      "LimitAmount": {
          "currency": currency_code_hex,
          "issuer": issuerAccount,
          "value": totalFor
      }
  }

  try {

    let result = await sendSignedPayload(client, wallet.seed, wallet_trust_set_tx);

    if (result.result.meta.TransactionResult != "tesSUCCESS") {
      console.log(`Could not add trustline to wallet ${wallet.address}`);
      console.log(`${result.result.meta.TransactionResult}`);
    } {
      console.log(`Trust line added from ${issuerAccount} to ${wallet.address}`);
    }

    return result;

  }
  catch (e) {
      console.log(`${e}`);
      return;
  }

}
var sendTokensToWallet = async function(client, wallet, destinationAccount, issuerAccount, currencyCode, amountToSend) {

    let currency_code_hex = parseCurrencyCode(currencyCode);

    if (isNumber(amountToSend)) {
      amountToSend = `${amountToSend}`;
    }

    var send_token_tx = {
      "TransactionType": "Payment",
      "Destination": destinationAccount,
      "Account": wallet.address,
      "Amount": {
          "currency": currency_code_hex,
          "issuer": issuerAccount,
          "value": amountToSend
      }
    }

    try {

      let result = await sendSignedPayload(client, wallet.seed, send_token_tx);
  
      if (result.result.meta.TransactionResult != "tesSUCCESS") {
        console.log(`Could not send tokens to wallet ${wallet.address}`);
        console.log(`${result.result.meta.TransactionResult}`);
      } else {
        console.log(`Wallet ${destinationAccount} received ${amountToSend} of ${currencyCode}`);
      }
  
      return result;
  
    }
    catch (e) {
        console.log(`${e}`);
        return;
    }



}
var fundThisWallet = async function(client, wallet, amountToSend) {

  if (isNumber(amountToSend)) {
    amountToSend = `${amountToSend}`;
  }

  var result = await client.fundWallet(wallet, { amount: amountToSend });

  if (!result || !result.wallet || result.balance < amountToSend) {
    console.log(`Could not fund wallet ${wallet.address}`);
  } else {
    console.log(`Wallet ${result.wallet.address} funded with ${amountToSend}`);
  }

  return result;

}
var generateWallets = async function(client, amount, fundWithAdditional) {

  let wallets = [];
  let i = 0;

  while (i < amount) {
      const fund_result = await client.fundWallet();
      const new_wallet = fund_result.wallet
      wallets.push(new_wallet);
      console.log(`Wallet generated s:${new_wallet.seed} r:${new_wallet.address}`);

      if (fundWithAdditional && fundWithAdditional > 0) {
        await fundThisWallet(client, new_wallet,fundWithAdditional);
      }

      i++;
  }

  return wallets;

}
var getWalletFromSeed = function(seed) {

  return xrpl.Wallet.fromSecret(seed);

}
var generateWallet = async function(client, fundWithAdditional) {

  var result = await client.fundWallet();

  if (fundWithAdditional && fundWithAdditional > 0) {
    await fundThisWallet(client, result.wallet,fundWithAdditional);
  }

  console.log(`New wallet created s:${result.wallet.seed} r:${result.wallet.address}`);

  return result.wallet;

}

var parseCurrencyCode = function(currencyCode) {

  if (currencyCode.length > 3 && currencyCode.length < 40) { 
      return pad('0000000000000000000000000000000000000000', utf8ToHex(currencyCode), true);
  }

  return currencyCode;

}

var rippleTime = () => new Date(Date.parse("1/1/2000 00:00:00Z")).getTime();


// Private methods
function checkMinBalance(minBalance) {

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
function pad(pad, str, padLeft) {
  if (typeof str === 'undefined') 
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}
function XrpBalanceToDrops(amount) { return (amount * 1000000) }


// Public module
module.exports = {
  xrpl: xrpl,
  maxDate: maxDate,
  minDate: minDate,
  rippleTime: rippleTime,
  utf8ToHex: utf8ToHex,
  hexToUtf8: hexToUtf8,
  getClientAsync: async function(server) {
    const client = new xrpl.Client(server ?? 'wss://xrpl.link');
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
  getWalletTradingStats: getWalletTradingStats,
  getAllCurrentNftsAsync: getAllCurrentNftsAsync,
  getIssuedNftIdsFromWallet: getIssuedNftIdsFromWallet,
  getTx: getTx,
  getNftInfo: getNftInfo,
  sendSignedPayload : sendSignedPayload,
  cancelNftOffer : cancelNftOffer,
  findAndCancelExpiredNftOffers: findAndCancelExpiredNftOffers,
  createNftCollection : createNftCollection,
  createNftOffer : createNftOffer,
  acceptNftOffer : acceptNftOffer,
  airdropToken: airdropToken,
  getLedgerDetails: getLedgerDetails,
  setupAccountAsIssuer: setupAccountAsIssuer,
  createTrustLine:createTrustLine,
  sendTokensToWallet: sendTokensToWallet,
  fundThisWallet: fundThisWallet,
  generateWallets: generateWallets,
  getWalletFromSeed : getWalletFromSeed,
  generateWallet: generateWallet,
  parseCurrencyCode: parseCurrencyCode

};

