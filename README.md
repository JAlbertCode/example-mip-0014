# MIP-0014 — Native Unshielded Token (reference)

A working reference implementation of [MIP-0014: Native Unshielded Token Standard](https://github.com/midnightntwrk/midnight-improvement-proposals/blob/main/mips/mip-0014-native-unshielded-token.md).

A native unshielded token is a fungible asset that lives as unshielded UTXOs on the ledger — publicly valued and owned by a `UserAddress`. Its defining property is that the issuing contract is an *issuer, not a custodian*: the contract is required only to create or destroy supply (mint and burn). Holding, transfer, receipt, and balance checks are native ledger operations that never touch the contract.

## What the terms mean, in code

| Term | In this implementation |
|------|------------------------|
| "the contract mints, then steps out" | after `_mint`, transfers happen through native ledger operations (`sendUnshielded` / the wallet); the contract is not called again |
| "issuer, not custodian" | the contract keeps no balance map and never holds or moves a holder's coins |
| "bearer instrument" | a coin is an unshielded UTXO owned by a `UserAddress`, spent under a Schnorr signature |
| token identity | the color, `tokenType(domain, issuer)` — `name` and `symbol` are labels, never identity |

## Two conforming shapes

MIP-0014 defines the standard, not a single token. Two issuer shapes satisfy it, and both are included here:

**Fixed supply** ([`FixedSupplyUnshieldedToken`](contracts/FixedSupplyUnshieldedToken.compact)) — mints its entire supply in the constructor and exposes no further mint or burn. Because there is no post-launch supply operation, it needs no authorization; it composes the core token alone.

**Mintable** ([`MintableUnshieldedToken`](contracts/MintableUnshieldedToken.compact)) — can mint after launch, so it must control who may mint. It composes the core token with a separate authorization module.

## Authorization

The permission check lives in its own module, [`MintAuthorization`](contracts/modules/MintAuthorization.compact), kept separate from the token so an issuer can choose its own policy — single owner, multisig, roles — without modifying the token. It verifies in zero knowledge that the caller knows a committed secret. It does not use `ownPublicKey()`, which a caller can supply freely and is not bound to the proof.

## The pieces

| File | Role |
|------|------|
| [`NativeUnshieldedToken`](contracts/modules/NativeUnshieldedToken.compact) | core token: mint, burn, color, metadata; no authorization of its own |
| [`MintAuthorization`](contracts/modules/MintAuthorization.compact) | optional access-control module for mint/burn |
| [`FixedSupplyUnshieldedToken`](contracts/FixedSupplyUnshieldedToken.compact) | example: fixed supply, no authorization |
| [`MintableUnshieldedToken`](contracts/MintableUnshieldedToken.compact) | example: mintable, gated by the authorization module |

## Build and test

```bash
npm run compile
npm ci && npm test
```

Requires the Compact toolchain (compiler 0.31.x) and Node 22+.

## Notes

- **Public by design.** Balances, transfers, and ownership are visible on-chain; this standard makes no privacy guarantee.
- **No post-issuance control.** Once minted, coins are unconditional bearer instruments — no freeze, pause, or clawback at this layer.
- **Identity is the color.** A wallet must recompute `tokenType(domain, issuer)` and reject metadata whose color does not match.

## License

Apache-2.0.
