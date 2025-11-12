// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
    "factory": "0x9Dbfb8997518d43466A1C7Dc25D3348766f872D2",
  "memedBattle": "0xD631ACBce54F16dFDB47F4aCbe577140C3cd4770",
  "memedBattleResolver": "0x6e5Ba643e63Ceb65CBa4cDD43ECA71a9e4a3cf51",
  "memedEngageToEarn": "0xb74C92eEbeDA1890ED271A19eddCc71942167451",
  "memedTokenSale": "0x49CC2e524B1e1f8337bE7ec8A670dbB5b6bF71ef"

} as const;

// It's also useful to export them individually for direct import
export const FACTORY_ADDRESS = CONTRACT_ADDRESSES.factory;
export const BATTLE_ADDRESS = CONTRACT_ADDRESSES.memedBattle;
export const BATTLE_RESOLVER_ADDRESS = CONTRACT_ADDRESSES.memedBattleResolver;
export const ENGAGE_TO_EARN_ADDRESS = CONTRACT_ADDRESSES.memedEngageToEarn;
export const TOKEN_SALE_ADDRESS = CONTRACT_ADDRESSES.memedTokenSale;

// Payment token for fair launch commitments
export const PAYMENT_TOKEN_ADDRESS = "0xc190e6F26cE14e40D30251fDe25927A73a5D58b6" as const;
