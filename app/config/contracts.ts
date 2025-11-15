// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0x5F6F5dE1Bc7D55F8E39ed96678c16f48556067db",
  memedBattle: "0xC97B080C92c97c3E032867b133C7591623E43735",
  memedBattleResolver: "0x70753723151DAE0D320dAFfc8FCfec6FABD40746",
  memedEngageToEarn: "0xac74D22AD556435AE6626B67fA8a21E719629EF2",
  memedTokenSale: "0xb8455B67dcADe28D169c2A178695D8959e38237c",
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
