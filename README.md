# CombatKanga

One of the first ever NFT based games on the XRPL - Now opening up some of its tool bag to help other XRPL (NFT or not) projects work with XRPL SDK and Xumm SDK

**We will be updating this repo as often as we can. Open to suggestions for tools which the community would like to see implemented.**
**Contact us support@combatkanga.com**

## Setup - NPM packages
`npm install xrpl -g`
`npm install from-exponential`
`npm install mathjs`

## CombatKanga utilities

### ckTools.js
For now a bit of a dumping ground for utility functions but will be cleaned up and turned into the main package

#
#### TokenRichList.js
Simply change the `currencyId` and `issuer` to your tokens currency and issuer wallet address to see yoiur tokens rich list!

**Usage**
> `currencyId`: *Your currency Id (Hex string) - E.g : 784B616E67614D4B310000000000000000000000*
>
> `issuer`: *Your curreny issuer wallet Id*
> 
> `maxAccountsToShow`: *How many accounts to show*
> 
> `minBalance`: *A minimum balance required to be included in the list*

#
#### GetWalletTrustLineInfo.js
Pulls back all the times a trust line has been added and removed from a wallet

**Usage**
> `currencyId`: *Your currency Id (Hex string) - E.g : 784B616E67614D4B310000000000000000000000*
>
> `issuer`: *Your curreny issuer wallet Id*
> 
> `account`: *Account / Wallet Id to lookup*
> 
> `oldest`: *How far to look back on the ledger*

#
#### GetWalletTransactions.js
Gets all the transactions which have been made.

**Usage**
> `account`: *Account / Wallet Id to lookup*
> 
> `oldest`: *How far to look back on the ledger*
#
#### GetWalletTradingStats.js
Generate trading (Buying/Selling, sending and receiving) of tokens from a list of transactions.

**Usage**
> `account`: *Account / Wallet Id to lookup*
> 
> `oldest`: *How far to look back on the ledger*
> > 
> `currencyId`: *the currency you want to check (Hex string) - E.g : 784B616E67614D4B310000000000000000000000*

