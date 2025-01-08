//  Copyright 2025 CombatKanga Ltd (Company number 13709049)
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
//  If you want help using the XRPL.js libary or Bitcoin or want us to add ant more functions
//  please get in contact with us at [[support@combatkanga.com]]
//
//




//
// Coming soon.
//








// const axios = require('axios');

// const ORDISCANN_API_BASE_URL = 'https://ordiscan.com/api';
// const BLOCKSTREAM_API_BASE_URL = 'https://blockstream.info/api';
// const WALLET_ADDRESS = '';

// async function fetchBitcoinTransactions(address) {


//   var data = [];
//   var lastSeen = "";

//   while(true) {

//     try {

//         var url = `${BLOCKSTREAM_API_BASE_URL}/address/${address}/txs`;
//         if (lastSeen) {
//             url += `/chain/${lastSeen}`
//         }

//         const response = await axios.get(url);

//         data.push(...response.data)

//         break;

//         if (response.data.length == 25) {
//             lastSeen = response.data[24].txid;
//             await delay(500);
//         } else {
//             break;
//         }

//         //return response.data;

//       } catch (error) {
//         console.error('Error fetching Bitcoin transactions:', error);
//         break;
//       }

//   }

//   return data;


// }
// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

// async function fetchOrdinals(address) {
//   try {
//     const response = await axios.get(`${ORDISCANN_API_BASE_URL}/address/${address}/inscriptions`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching ordinals:', error);
//     return [];
//   }
// }

// async function processTransactions(address) {
//   const transactions = await fetchBitcoinTransactions(address);
//   const ordinals = await fetchOrdinals(address);

//   let totalReceived = 0;
//   let totalSent = 0;
//   const AddressReceivedFrom = {};
//   const AddressSentTo = {};

//   // Iterate over transactions
//   for (const tx of transactions) {
//     const isOrdinalTransaction = ordinals.some(ordinal => ordinal.tx === tx.txid);

//     // Skip transactions related to ordinals
//     if (isOrdinalTransaction) continue;

//     // Received amounts
//     for (const vin of tx.vin) {
//       if (vin.prevout && vin.prevout.scriptpubkey_address === address) {
//         const value = vin.prevout.value / 1e8; // Convert from satoshis to BTC
//         totalSent += value;
//         if (!AddressReceivedFrom[vin.prevout.scriptpubkey_address]) {
//             AddressReceivedFrom[vin.prevout.scriptpubkey_address] = { total: 0, transactions: [] };
//         }
//         AddressReceivedFrom[vin.prevout.scriptpubkey_address].total += value;
//         AddressReceivedFrom[vin.prevout.scriptpubkey_address].transactions.push({ amount: value, tx: tx.txid });
//       }
//     }

//     // Sent Amounts
//     for (const vout of tx.vout) {
//       if (vout.scriptpubkey_address != address) {
//         const value = vout.value / 1e8; // Convert from satoshis to BTC
//         totalReceived += value;
//         if (!AddressSentTo[vout.scriptpubkey_address]) {
//             AddressSentTo[vout.scriptpubkey_address] = { total: 0, transactions: [] };
//         }
//         AddressSentTo[vout.scriptpubkey_address].total += value;
//         AddressSentTo[vout.scriptpubkey_address].transactions.push({ amount: value, tx: tx.txid });
//       }
//     }
//   }

//   return {
//     totalReceived,
//     totalSent,
//     AddressReceivedFrom: Object.entries(AddressReceivedFrom).map(([address, data]) => ({
//       address,
//       total: data.total,
//       transactions: data.transactions,
//     })),
//     AddressSentTo: Object.entries(AddressSentTo).map(([address, data]) => ({
//       address,
//       total: data.total,
//       transactions: data.transactions,
//     })),
//   };
// }

// processTransactions(WALLET_ADDRESS);