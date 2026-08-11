// Witness implementation for the mintable example issuer.
//
// The only witness is `secretKey`, from the composable MintAuthorization module:
// the minter's authorization secret. `mint`/`burn` recompute the domain-separated
// commitment from it in zero knowledge and compare against the on-chain `minter`
// commitment — so the secret authorizes issuance without ever appearing on-chain
// and without relying on `ownPublicKey()`.

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '../contracts/managed/mintable-unshielded-token/contract/index.js';

/** Private state carried alongside the contract: the minter's secret. */
export type MintablePrivateState = {
  readonly secretKey: Uint8Array;
};

/** Build the private state from a 32-byte minter secret. */
export const createMintablePrivateState = (secretKey: Uint8Array): MintablePrivateState => ({
  secretKey,
});

export const witnesses = {
  secretKey(
    context: WitnessContext<Ledger, MintablePrivateState>,
  ): [MintablePrivateState, Uint8Array] {
    return [context.privateState, context.privateState.secretKey];
  },
};
