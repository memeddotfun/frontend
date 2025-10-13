// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0x3f9293d413a6644c811A77b9e5237272Eac38DC0",
  memedBattle: "0x8A561626d4396A14eD5577dD63F031083Cb2dda3",
  memedBattleResolver: "0xC46a0778D82Dc299a5Bc3c0582773B5877880167",
  memedEngageToEarn: "0x09d8302e82539A221c108823b9B058f7582beb8d",
  memedTokenSale: "0xF955116a4dd29b33cC5D9ce201821178b7862FC6",
} as const;

// It's also useful to export them individually for direct import
export const FACTORY_ADDRESS = CONTRACT_ADDRESSES.factory;
export const BATTLE_ADDRESS = CONTRACT_ADDRESSES.memedBattle;
export const BATTLE_RESOLVER_ADDRESS = CONTRACT_ADDRESSES.memedBattleResolver;
export const ENGAGE_TO_EARN_ADDRESS = CONTRACT_ADDRESSES.memedEngageToEarn;
export const TOKEN_SALE_ADDRESS = CONTRACT_ADDRESSES.memedTokenSale;
