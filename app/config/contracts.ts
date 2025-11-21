// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0x031268f925C07C23AD263EB7D4b0B23B9528e097",
  memedBattle: "0x12eCa5F4F2b50e39963cDDCD76fe8D66A8e4188F",
  memedBattleResolver: "0x9F1a4A5F9e4529cB06F256E6FBb28F73FFB19788",
  memedEngageToEarn: "0xDe777a91d9F4A60589e99ec77dbc97Febc96a464",
  memedTokenSale: "0x3f1b9E078Eb360284291B703367Fe2209ADA8aA9",
} as const;

// It's also useful to export them individually for direct import
export const FACTORY_ADDRESS = CONTRACT_ADDRESSES.factory;
export const BATTLE_ADDRESS = CONTRACT_ADDRESSES.memedBattle;
export const BATTLE_RESOLVER_ADDRESS = CONTRACT_ADDRESSES.memedBattleResolver;
export const ENGAGE_TO_EARN_ADDRESS = CONTRACT_ADDRESSES.memedEngageToEarn;
export const TOKEN_SALE_ADDRESS = CONTRACT_ADDRESSES.memedTokenSale;

// Payment token for fair launch commitments
export const PAYMENT_TOKEN_ADDRESS =
  "0xc190e6F26cE14e40D30251fDe25927A73a5D58b6" as const;
