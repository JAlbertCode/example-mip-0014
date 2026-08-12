// Public entry point for the native unshielded token reference.
//
// Implements MIP-0014, Native Unshielded Token Standard:
// https://github.com/midnightntwrk/midnight-improvement-proposals/blob/main/mips/mip-0014-native-unshielded-token.md

// In-memory simulators.
export {
  FixedSupplyUnshieldedTokenSimulator,
  type FixedSupplyParams,
} from './fixedSupplySimulator.js';
export {
  MintableUnshieldedTokenSimulator,
  type SimulatorParams,
} from './simulator.js';

// Recipient helpers.
export { type Recipient, toUser, toContract, ZERO_USER } from './recipient.js';

// Mintable authorization: witness, private state, and off-chain commitment.
export {
  witnesses,
  createMintablePrivateState,
  type MintablePrivateState,
} from './witnesses.js';
export { authPublicKey, MINTER_DOMAIN_SEP } from './commitment.js';
