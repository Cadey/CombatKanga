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

const xrpl = require('xrpl');

var getAllTrustLines = async function(client, issuer, limit = Number.MAX_SAFE_INTEGER ,minBalance = null) {

  let getTrustLines = {
    "command": "account_lines",
    "account": issuer,
    "ledger_index": "validated",
    "limit": limit
  };

  let trustLines = [];
  await processAllMarkers(client, getTrustLines, (batch) => {

    if (!minBalance || minBalance == 0) {
      trustLines = trustLines.concat(batch.result.lines)
    }
    else {
      trustLines = trustLines.concat(batch.result.lines.filter(
        (line) => {
          
          if (isOptingOut(line.account))
            return false;
    
          return isBalanceEnough(line, minBalance);
    
        }
      ));
    }

  });

  return trustLines;

}
var isBalanceEnough = function(line, requireBalance)  {
  return (parseInt(line.balance) * -1) >= requireBalance && line.currency === currency_xKangaMK1;
}
var processAllMarkers = async function(client, request, perBatch) {

  let scan = true;
  let marker = null;
  let logLine = `$Command: ${request.command} -`;
  while(scan) {

    if (marker)
      request.marker = marker;

    let response = await client.request(request);
    scan = (response.result.marker != null);

    perBatch(response);

    if (scan) {
      marker = response.result.marker;
      console.log(`${logLine} Processing next batch - ${marker}`)
    } else
      console.log(`${logLine} Finished processing batches`)

  }

}
var toPositiveBalance = function(blanace) {

  if (blanace >= 0)
    return blanace;

  let tempBalance = blanace * -1;

  let decimal = tempBalance.toString().split(".");
  if (decimal.length > 1) {
    if (parseInt(decimal[1]) >= 99)
      tempBalance = parseInt(decimal[0]) + 1;
  }

  return tempBalance;

}

module.exports = {
  xrpl: xrpl,
  getClientAsync: async function() {
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();
    return client;
  },
  getAllTrustLines : getAllTrustLines,
  isBalanceEnough : isBalanceEnough,
  processAllMarkers : processAllMarkers,
  toPositiveBalance : toPositiveBalance
};

