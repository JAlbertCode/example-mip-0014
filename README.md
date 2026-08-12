# MIP-0014 — Native Unshielded Token (reference)

A working reference implementation of [MIP-0014: Native Unshielded Token Standard](https://github.com/midnightntwrk/midnight-improvement-proposals/blob/main/mips/mip-0014-native-unshielded-token.md).

A native unshielded token is a fungible asset that lives as unshielded UTXOs on the ledger, publicly valued and owned by a `UserAddress`. Its defining property is that the issuing contract is an *issuer, not a custodian*: it creates or destroys supply (mint and burn), while holding, transfer, receipt, and balance checks are native ledger operations that never touch the contract.

The core is deliberately unrestricted; authorization is a separate policy an issuer composes on top, so the token logic and the access rules stay independent.

## What the terms mean, in code

| Term | In this implementation |
|------|------------------------|
| "the contract mints, then steps out" | after `_mint`, transfers happen through native ledger operations (`sendUnshielded` / the wallet); the contract is not called again |
| "issuer, not custodian" | the contract keeps no balance map and never holds or moves a holder's coins |
| "bearer instrument" | a coin is an unshielded UTXO owned by a `UserAddress`, spent under a Schnorr signature |
| token identity | the color, `tokenType(domain, issuer)`; `name` and `symbol` are labels, never identity |

## The pieces

| File | Role |
|------|------|
| [`NativeUnshieldedToken`](contracts/modules/NativeUnshieldedToken.compact) | the primitive: `_mint`, `_burn`, `tokenColor`, metadata; no authorization of its own |
| [`MintAuthorization`](contracts/modules/MintAuthorization.compact) | composable mint/burn gate: proves knowledge of a committed secret |
| [`FixedSupplyUnshieldedToken`](contracts/FixedSupplyUnshieldedToken.compact) | example: fixed supply, no authorization |
| [`MintableUnshieldedToken`](contracts/MintableUnshieldedToken.compact) | example: mintable, gated by `MintAuthorization` |

The core is a module, so it needs a contract to compose it. The two examples show the range:

**Fixed supply** mints its whole supply once, via a one-shot `initialize()` run after deploy, then does nothing else. It needs no authorization, so it composes the core alone. It mints in `initialize()` rather than the constructor because `kernel.self()` is a zero placeholder during construction, which would color the coins wrong.

**Mintable** can mint after launch, so it gates `mint`/`burn` with `MintAuthorization`. The gate stores a `Bytes<32>` commitment and checks the caller in-circuit against a secret, so authorization is bound to the proof.

## Build and test

```bash
npm run compile
npm ci && npm test
```

Requires the Compact toolchain (compiler 0.31.x) and Node 22+. `npm test` runs the unit suite against an in-memory simulator.

## Notes

- **Public by design.** Balances, transfers, and ownership are visible on-chain; this standard makes no privacy guarantee.
- **No post-issuance control.** Once minted, coins are unconditional bearer instruments: no freeze, pause, or clawback at this layer.
- **Identity is the color.** A wallet must recompute `tokenType(domain, issuer)` and reject metadata whose color does not match.
- **Burn address.** Burns go to a single all-zeroes `UserAddress` that no key can sign for. Compact has no stdlib primitive for this yet.

## License

Apache-2.0.
