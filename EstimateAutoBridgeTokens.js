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

const BigNumber = require('bignumber.js');

// Private variables
var ckTools = require('./ckTools');

const sourceCurrencyId = "[Currency]";
const sourceIssuer = "[Wallet_R_Address]";
const destinationCurrencyId = "[Currency]";
const destinationIssuer = "[Wallet_R_Address]";
const amountToSell = 1000;

const DECIMAL_PLACES = 15;

// Private methods
async function EstimateAutoBridgeTokens() {

    let client = await ckTools.getClientAsync();

    let sourceOffers = await ckTools.getBookOffers(client, sourceIssuer, sourceCurrencyId, "", "XRP");
    let totalXrp = GetEstimatedTotalDestinationToken(sourceOffers.offers, amountToSell, sourceCurrencyId, "XRP")

    console.log(`Estimated ${toXrplValue(totalXrp)} in XRP from ${sourceCurrencyId}`)

    let destinationOffers = await ckTools.getBookOffers(client, "", "XRP", destinationIssuer, destinationCurrencyId);
    let totalXpm = GetEstimatedTotalDestinationToken(destinationOffers.offers, toXrplValue(totalXrp), "XRP", destinationCurrencyId)

    console.log(`Estimated ${toXrplValue(totalXpm)} ${destinationCurrencyId} from ${toXrplValue(totalXrp)} XRP`)

    process.exit(0);

}
function GetEstimatedTotalDestinationToken(offers, amountToSell, sourceCurrencyId, targetCurrencyId) {
    let remaining = new BigNumber(amountToSell);
    let totalTarget = new BigNumber("0");
    let xrpToDrops = new BigNumber("0.000001");

    const getAmountFromCurrency = (currency) => new BigNumber(currency["value"] ?? currency);

    for (var counter = 0; counter < offers.length; counter++) {

        var offer = offers[counter];
        var getting = getAmountFromCurrency(offer['taker_gets_funded'] ?? offer['TakerGets']);
        var gives = getAmountFromCurrency(offer['taker_pays_funded'] ?? offer['TakerPays']);

        if (sourceCurrencyId === "XRP") {
            gives = gives.multipliedBy(xrpToDrops);
        }

        if (targetCurrencyId === "XRP") {
            getting = getting.multipliedBy(xrpToDrops);
        }

        let targetValue = getting.dividedBy(gives);

        //console.log(`1 ${sourceCurrencyId} = ${targetValue} ${targetCurrencyId}`);
        //console.log(`Can give : ${toXrplValue(gives)} ${sourceCurrencyId} Remaining: ${toXrplValue(remaining)}`);

        if (gives.isGreaterThanOrEqualTo(remaining)) {
            totalTarget = totalTarget.plus(targetValue.multipliedBy(remaining));
            remaining = new BigNumber("0");
            break;
        } else {
            //console.log(`Offer : ${toXrplValue(gives)} ${sourceCurrencyId} for ${toXrplValue(targetValue.multipliedBy(gives))} ${targetCurrencyId}`);
            totalTarget = totalTarget.plus(targetValue.multipliedBy(gives));
            remaining = remaining.minus(gives);
        }
    }

    if (remaining > 0) {
        throw error("Order book to thin")
    }

    return totalTarget;
}
function toXrplValue(bigNumber) { 
    return bigNumber.dp(DECIMAL_PLACES).toString()  
} 

// Init
EstimateAutoBridgeTokens();
