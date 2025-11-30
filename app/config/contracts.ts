// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0xdfc232bf42eCD19a08134457938FE12E7C83Fcd0",
  memedBattle: "0x7c8df5Fb2F550f26EAB506909a36eAF789801e0f",
  memedBattleResolver: "0x2c3270F0ad152DA8a8f1Ce16bC4900BE00723F88",
  memedEngageToEarn: "0xF92693A847EE938DF7Ccf1FcB1c249f77977D130",
  memedTokenSale: "0x403bE6F6f322240480C0BA101e90E9bE4a777DB8",
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
