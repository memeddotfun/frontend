// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0x072cdE22E39b9A87d74f8D88072f3A1685dC001a",
  memedBattle: "0x739E3B8a1910be1a7176e371e641251BED2cF1E3",
  memedBattleResolver: "0x78923e954b6Ab434244107e3b2833C276025480C",
  memedEngageToEarn: "0xb13A9364E5bF2d99A44798C20eEfdE8960203164",
  memedTokenSale: "0x984188DF3AeCA3533a20f1D874AB58af6dc5eB88",
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
