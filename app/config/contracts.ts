// =================================================================================
// Contract Addresses
// =================================================================================

// The following addresses are for the Base Sepolia testnet.
// TODO: Add addresses for other networks as needed.

export const CONTRACT_ADDRESSES = {
  factory: "0xd4Eba26FF0b30C4140A1F7C291847E04b8C7F285",
  memedBattle: "0xCBA2C591caE53ABD78a96B0c812Da9C1044F4097",
  memedBattleResolver: "0x5efDd10Bb299b4cb702150a834a974f24fC587a0",
  memedEngageToEarn: "0xDe2D9755c6bC9eB1FEA4d1a5C7AE44de3312A4D3",
  memedTokenSale: "0x06aAFFF6C790db9b698c1Fe8bB22cf274eE3a38D",

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
