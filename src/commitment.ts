// Off-chain computation of the minter authorization commitment.
//
// The MintAuthorization module verifies, in zero knowledge, that
//   minter == persistentHash<Vector<2,Bytes<32>>>([pad(32, SEP), secretKey()])
// To deploy, the issuer must publish that commitment. This helper computes it
// with the exact same primitive and descriptor the circuit uses.

import {
  CompactTypeBytes,
  CompactTypeVector,
  persistentHash,
} from '@midnight-ntwrk/compact-runtime';

// Domain-separator string, kept in lockstep with MintAuthorization.compact and
// MIP-0014. Must be <= 32 bytes and identical across all conforming implementations.
export const MINTER_DOMAIN_SEP = 'midnight:unshielded:minter';

const padTo32 = (s: string): Uint8Array => {
  const encoded = new TextEncoder().encode(s);
  if (encoded.length > 32) {
    throw new Error(`domain separator "${s}" exceeds 32 bytes (${encoded.length})`);
  }
  const out = new Uint8Array(32);
  out.set(encoded);
  return out;
};

/**
 * Compute the minter commitment for a 32-byte secret. Mirrors the in-circuit
 * `authPublicKey(secretKey())`.
 */
export const authPublicKey = (secretKey: Uint8Array): Uint8Array => {
  if (secretKey.length !== 32) {
    throw new Error(`secretKey must be exactly 32 bytes, got ${secretKey.length}`);
  }
  const descriptor = new CompactTypeVector(2, new CompactTypeBytes(32));
  return persistentHash(descriptor, [padTo32(MINTER_DOMAIN_SEP), secretKey]);
};
