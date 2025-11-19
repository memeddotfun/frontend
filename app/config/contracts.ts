// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0xBe71aD0B123558Bc3Eaa789Dfe050f0AE382B6f0",
  memedBattle: "0x29aBC49420a1d3e3e1496B9476EF240eDae063ed",
  memedBattleResolver: "0xC0934b877d600832F018d1d9a6440E641cf0A8F1",
  memedEngageToEarn: "0xd5D227ded42ef9b0a2aBD7d46B0310b0cFe37bBA",
  memedTokenSale: "0x10EA7e6CBb1363f777082Ee91d906C065CaE23d7",
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
