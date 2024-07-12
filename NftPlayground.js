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


//!!!!!!!!!!!!!!!!!!!!!!!
//!!!!!!!!!!!!!!!!!!!!!!!
//!!      WARNING      !! - This code looks a bit messy, but we are showing different scenarios of how offers interact on the ledger
//!!!!!!!!!!!!!!!!!!!!!!!
//!!!!!!!!!!!!!!!!!!!!!!!


var total_nfts = null;
var issuer_account_seed = null;
var collection_taxon = null;
var transfer_fee = null;
var nft_flags = null;

var owner_account_seeds = [];

const network_server = 'wss://s.altnet.rippletest.net:51233';

// Private methods
async function SetupNftPlayground() {

    let client = await ckTools.getClientAsync(network_server);
    
    // Create the NFT Collection
    let nftCollection = await GenerateSomeNfts(client);

    // Create some Accounts to move NFTs around with
    let accounts = await GenerateSomeAccounts(client);

    // Transfer some NFTs from the issuer to the accounts
    let tOffers = await GenerateSomeTransferOffers(client, nftCollection.issuerAccount, accounts, nftCollection.nfts);
    await AcceptSomeOffers(client, accounts, tOffers);

    // Create a bunch of buy and sell offer scenarios, including results like un-funded offers and orphened offers.
    await BuyAndSellNfts(client, accounts, nftCollection.nfts);

    process.exit(1);


}
async function GenerateSomeNfts(client) {

    let nftsNeeded = 10;
    let totalNfts = total_nfts ? total_nfts : nftsNeeded; // 10 Nfts
    let taxon = collection_taxon ? collection_taxon : 1; // Taxon 1
    let transferFee = transfer_fee ? transfer_fee : 10000; // 10%
    let flags = nft_flags ? nft_flags : 8; // tfTransferable
    let metaDataUris = [];

    // Change this if you want to point to some real metadata.
    if (totalNfts < nftsNeeded) {
        totalNfts = nftsNeeded;
    }
    for(var x = 0; x < totalNfts; x++) {
        metaDataUris.push(`https://test.com/${x}.json`)
    }

    // Create our issuer account for the NFT Collection
    let issuerAccount = issuer_account_seed ? ckTools.getWalletFromSeed(issuer_account_seed) : await ckTools.generateWallet(client);
    console.log(`Issuer account created s:${issuerAccount.seed} r:${issuerAccount.address}`);

    // Mint the NFTs
    var nfts = await ckTools.createNftCollection(client, issuerAccount.address, issuerAccount.seed,
         taxon, transferFee, flags, metaDataUris);

    return {issuerAccount, nfts}

}
async function GenerateSomeAccounts(client) {

    let totalWalletsNeeded = 10

    // Create some additional accounts to move the NFTs around with
    let ownerAccounts = [];
    if (owner_account_seeds.length > 0) {
        owner_account_seeds.forEach(e => ownerAccounts.push(ckTools.getWalletFromSeed(e)));
    }
    
    // Make sure we have at least 10 accounts.
    if (ownerAccounts.length < totalWalletsNeeded) {
        var needed = (totalWalletsNeeded - ownerAccounts.length);
        for (let i = 0; i < needed; i++) { 
            ownerAccounts.push(await ckTools.generateWallet(client, 500));
        }
    } 

    return ownerAccounts;

}
async function GenerateSomeTransferOffers(client, nftOWnerAccount, accounts, nfts) {
    
    // Transfer some NFTs
    let tOffers = [];
    tOffers.push(await ckTools.createNftOffer(client, nftOWnerAccount.address, nftOWnerAccount.seed,
        accounts[0].address, nfts.tokenIds[0], 0, 'xrp', '', 1200, true, `Transfer to ${accounts[0].address}`));
    tOffers.push(await ckTools.createNftOffer(client, nftOWnerAccount.address, nftOWnerAccount.seed,
        accounts[0].address, nfts.tokenIds[1], 0, 'xrp', '', 1200, true, `Transfer to ${accounts[0].address}`));
    tOffers.push(await ckTools.createNftOffer(client, nftOWnerAccount.address, nftOWnerAccount.seed,
        accounts[1].address, nfts.tokenIds[2], 0, 'xrp', '', 1200, true, `Transfer to ${accounts[1].address}`));
    tOffers.push(await ckTools.createNftOffer(client, nftOWnerAccount.address, nftOWnerAccount.seed,
        accounts[1].address, nfts.tokenIds[3], 0, 'xrp', '', 1200, true, `Transfer to ${accounts[1].address}`));
    tOffers.push(await ckTools.createNftOffer(client, nftOWnerAccount.address, nftOWnerAccount.seed,
        accounts[2].address, nfts.tokenIds[4], 0, 'xrp', '', 1200, true, `Transfer to ${accounts[2].address}`));
    tOffers.push(await ckTools.createNftOffer(client, nftOWnerAccount.address, nftOWnerAccount.seed,
        accounts[2].address, nfts.tokenIds[5], 0, 'xrp', '', 1200, true, `Transfer to ${accounts[2].address}`));

    return tOffers;

}
async function BuyAndSellNfts(client, accounts, nfts) {
    

    // Sell some Nfts
    //---------------------------------------------------------------------------
    let sOffer1 = await ckTools.createNftOffer(client, accounts[0].address, accounts[0].seed, null, nfts.tokenIds[0], 10, 'xrp', '', 1200, true, `Sell to anyone`);
    console.log(`Created a sell offer for ${nfts.tokenIds[0]} which anyone can accept`);
    let sOffer2 = await ckTools.createNftOffer(client, accounts[0].address, accounts[0].seed, accounts[3].address, nfts.tokenIds[1], 10, 'xrp', '', 1200, true, `Sell to ${accounts[3].address}`);
    console.log(`Created a sell offer for ${nfts.tokenIds[1]} which only ${accounts[3].address} can accept`);

        // First offer will work, second will fail and the third one will work.
        var sr1 = await ckTools.acceptNftOffer(client, accounts[3].address, accounts[3].seed, null, sOffer1.offerId, null, `Accepting sell offer for ${nfts.tokenIds[0]}`);
        console.log(`Account ${accounts[3].address} accepted sell offer ${sOffer1.offerId} - Result ${sr1.result.meta.TransactionResult}`);
        
        var sr2 = await ckTools.acceptNftOffer(client, accounts[4].address, accounts[4].seed, null, sOffer2.offerId, null, `Acceping an offer which will fail, its for wallet ${accounts[3].address} but im ${accounts[4].address}`);
        console.log(`Account ${accounts[4].address} failed accepted sell offer ${sOffer2.offerId}, only ${accounts[3].address} can accept it - Result ${sr2.result.meta.TransactionResult}`);

        var sr3 = await ckTools.acceptNftOffer(client, accounts[3].address, accounts[3].seed, null, sOffer2.offerId, null, `Accepting sell offer for ${nfts.tokenIds[1]}`);
        console.log(`Account ${accounts[3].address} accepted sell offer ${sOffer2.offerId} - Result ${sr3.result.meta.TransactionResult}`);

    // Create and accept an offer the buyer cannot afford.
    //---------------------------------------------------------------------------
    let sOffer3 = await ckTools.createNftOffer(client, accounts[1].address, accounts[1].seed, null, nfts.tokenIds[2], 1000000, 'xrp', '', 1200, true, `Sell to anyone`);
    console.log(`Created a sell offer for ${nfts.tokenIds[2]} for 1000000 xrp`);

    var sr4 = await ckTools.acceptNftOffer(client, accounts[5].address, accounts[5].seed, null, sOffer3.offerId, null, `Accepting sell offer i cannot afford`);
    console.log(`Failed to accept offer ${sOffer3.offerId} as ${accounts[5].address} because its balance is too low - Result ${sr4.result.meta.TransactionResult}`);


    // Create an un-funded buy offer
    //---------------------------------------------------------------------------
    let bOffer1 = await ckTools.createNftOffer(client, accounts[6].address, accounts[6].seed, null, nfts.tokenIds[3], 1000000, 'xrp', '', 1200, false, `Creating an un-funded buy offer for ${nfts.tokenIds[3]}`, accounts[1].address);
    console.log(`Created an un-funded buy offer for ${nfts.tokenIds[3]} for 1000000 xrp`);

    var sr5 = await ckTools.acceptNftOffer(client, accounts[1].address, accounts[1].seed, bOffer1.offerId, null, null, `Accepting an un-funded buy offer for ${nfts.tokenIds[3]}`);
    console.log(`${accounts[1].address} failed to accept buy offer ${bOffer1.offerId} because ${accounts[6].address} balance was too low - Result ${sr5.result.meta.TransactionResult}`);


    // Create an orphaned offer, bOffer5 will be orphend and will fail because the owner changed.
    //---------------------------------------------------------------------------

    // This should be two sell offers, and then one is accepted and the second one should fail?
    let sOffer4 = await ckTools.createNftOffer(client, accounts[2].address, accounts[2].seed, null, nfts.tokenIds[4], 100, 'xrp', '', 1200, true, `Creating a sell offer for ${nfts.tokenIds[4]}`);
    console.log(`${accounts[6].address} Created a sell offer for ${nfts.tokenIds[4]} for 100 xrp`);

    let sOffer5 = await ckTools.createNftOffer(client, accounts[2].address, accounts[2].seed, null, nfts.tokenIds[4], 200, 'xrp', '', 1200, true, `Creating a sell offer for ${nfts.tokenIds[4]}`);
    console.log(`${accounts[7].address} Created a sell offer for ${nfts.tokenIds[4]} for 200 xrp`);

        // Accept the NFT buy so it goes to accounts[6]
        var sr6 = await ckTools.acceptNftOffer(client, accounts[6].address, accounts[6].seed, null, sOffer4.offerId, null, `Accepting a sell offer for ${nfts.tokenIds[4]} sending to ${accounts[6].address}`);
        console.log(`${accounts[6].address} accepts the sell offer from ${accounts[2].address} for 100 xrp - Result ${sr6.result.meta.TransactionResult}`);

        // Account 6 will now try to accept bOffer5 for 200 XRP, it should fail
        var sr7 = await ckTools.acceptNftOffer(client, accounts[7].address, accounts[7].seed, null, sOffer5.offerId, null, `Accepting a sell offer for ${nfts.tokenIds[4]} when it was already sold to ${accounts[6].address}`);
        console.log(`${accounts[7].address} failes to accepts the now orphended sell offer from ${accounts[2].address} for 200 xrp because it was already sold to ${accounts[6].address}  - Result ${sr7.result.meta.TransactionResult}`);

}
async function AcceptSomeOffers(client, accounts, tOffers) {

    // Accept the transfers
    await ckTools.acceptNftOffer(client, accounts[0].address, accounts[0].seed, null, tOffers[0].offerId, null, "Accepting transfer offer");
    await ckTools.acceptNftOffer(client, accounts[0].address, accounts[0].seed, null, tOffers[1].offerId, null, "Accepting transfer offer");
    await ckTools.acceptNftOffer(client, accounts[1].address, accounts[1].seed, null, tOffers[2].offerId, null, "Accepting transfer offer");
    await ckTools.acceptNftOffer(client, accounts[1].address, accounts[1].seed, null, tOffers[3].offerId, null, "Accepting transfer offer");
    await ckTools.acceptNftOffer(client, accounts[2].address, accounts[2].seed, null, tOffers[4].offerId, null, "Accepting transfer offer");
    await ckTools.acceptNftOffer(client, accounts[2].address, accounts[2].seed, null, tOffers[5].offerId, null, "Accepting transfer offer");

}

// Init
SetupNftPlayground();


