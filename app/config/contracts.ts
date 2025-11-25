// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0x50A815745b0F5440B63660AD494448b302b2E5C3",
  memedBattle: "0xC37FaABB780e8d1BF040e90E2d3Aea17C104EDC3",
  memedBattleResolver: "0x02A74dE4A164960224311c362bB60d8536fc84D8",
  memedEngageToEarn: "0x3A60D4A5Cb95090C6EB90e93475E1404d1E8C83F",
  memedTokenSale: "0x9732b24c8e28a2b03F218211C5AA7542C31b3A6B",
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
