// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0x74920a04A38264f615AF3fD166d7eBBe1342CbB9",
  memedBattle: "0x1360fcbd0a6D0991f75163543e8c1Ab30Da2402d",
  memedBattleResolver: "0xbeFb7C821f17aF245A10a79541439A97C25d21f9",
  memedEngageToEarn: "0x96838E931f08E227E176Cd310ff5A83F3e42FDA5",
  memedTokenSale: "0x64C46B2e658Ea2bcf024A4A33fEad54B9B7065Ab",

  // Chainlink ETH/USD Price Feeds (8 decimals)
  chainlinkEthUsdSepolia: "0x4aDC67696bA383F43DD60A9e78F2C356FB85a231", // Base Sepolia testnet
  chainlinkEthUsdMainnet: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Base Mainnet
} as const;

// It's also useful to export them individually for direct import
export const FACTORY_ADDRESS = CONTRACT_ADDRESSES.factory;
export const BATTLE_ADDRESS = CONTRACT_ADDRESSES.memedBattle;
export const BATTLE_RESOLVER_ADDRESS = CONTRACT_ADDRESSES.memedBattleResolver;
export const ENGAGE_TO_EARN_ADDRESS = CONTRACT_ADDRESSES.memedEngageToEarn;
export const TOKEN_SALE_ADDRESS = CONTRACT_ADDRESSES.memedTokenSale;

// Payment token for fair launch commitments (LEGACY - Now using native ETH)
export const PAYMENT_TOKEN_ADDRESS =
  "0xc190e6F26cE14e40D30251fDe25927A73a5D58b6" as const;

// Chainlink ETH/USD Price Feed Address
// Currently using Base Sepolia for development
export const CHAINLINK_ETH_USD_ADDRESS =
  CONTRACT_ADDRESSES.chainlinkEthUsdSepolia as `0x${string}`;

// To switch to Base Mainnet, uncomment the line below and comment out the line above:
// export const CHAINLINK_ETH_USD_ADDRESS = CONTRACT_ADDRESSES.chainlinkEthUsdMainnet as `0x${string}`;
