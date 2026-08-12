// In-memory simulator for the mintable example issuer.
//
// Wraps the compiled contract with the raw `@midnight-ntwrk/compact-runtime`
// circuit-context machinery so tests read like plain method calls. No proof
// server or devnet is required; circuits run against an in-memory ledger.
//
// Scope: `mint` works here, but `burn` also consumes a real unshielded input coin
// that only exists in a live transaction, so the simulator exercises burn's
// authorization guard but not the coin movement.

import {
  type CircuitContext,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  type Ledger,
  ledger,
} from '../contracts/managed/mintable-unshielded-token/contract/index.js';
import {
  createMintablePrivateState,
  type MintablePrivateState,
  witnesses,
} from './witnesses.js';
import { authPublicKey } from './commitment.js';
import type { Recipient } from './recipient.js';

export type SimulatorParams = {
  name: string;
  symbol: string;
  decimals: bigint;
  /** 32-byte domain separator; immutable once deployed. */
  domain: Uint8Array;
  /** 32-byte minter authorization secret (stays in private state). */
  minterSecret: Uint8Array;
  contractAddress?: string;
  coinPublicKey?: string;
};

export class MintableUnshieldedTokenSimulator {
  readonly contractAddress: string;
  private readonly contract: Contract<MintablePrivateState>;
  private context: CircuitContext<MintablePrivateState>;

  constructor(params: SimulatorParams) {
    const coinPK = params.coinPublicKey ?? '0'.repeat(64);
    this.contractAddress = params.contractAddress ?? sampleContractAddress();
    this.contract = new Contract<MintablePrivateState>(witnesses);

    const privateState = createMintablePrivateState(params.minterSecret);
    const minterCommitment = authPublicKey(params.minterSecret);

    const init = this.contract.initialState(
      createConstructorContext(privateState, coinPK),
      params.name,
      params.symbol,
      params.decimals,
      params.domain,
      minterCommitment,
    );

    this.context = createCircuitContext(
      this.contractAddress,
      init.currentZswapLocalState,
      init.currentContractState,
      init.currentPrivateState,
    );
  }

  getLedger(): Ledger {
    return ledger(this.context.currentQueryContext.state);
  }

  getPrivateState(): MintablePrivateState {
    return this.context.currentPrivateState;
  }

  /**
   * Swap the minter secret in private state, used to test that a caller who does
   * not know the committed secret is rejected. The on-chain `minter` commitment is
   * unchanged, so authorization must fail.
   */
  setMinterSecret(secret: Uint8Array): this {
    this.context = {
      ...this.context,
      currentPrivateState: createMintablePrivateState(secret),
    };
    return this;
  }

  name(): string {
    return this.run((ctx) => this.contract.impureCircuits.name(ctx));
  }

  symbol(): string {
    return this.run((ctx) => this.contract.impureCircuits.symbol(ctx));
  }

  decimals(): bigint {
    return this.run((ctx) => this.contract.impureCircuits.decimals(ctx));
  }

  tokenColor(): Uint8Array {
    return this.run((ctx) => this.contract.impureCircuits.tokenColor(ctx));
  }

  mint(recipient: Recipient, amount: bigint): Uint8Array {
    return this.run((ctx) => this.contract.impureCircuits.mint(ctx, recipient, amount));
  }

  burn(amount: bigint): [] {
    return this.run((ctx) => this.contract.impureCircuits.burn(ctx, amount));
  }

  private run<R>(
    fn: (ctx: CircuitContext<MintablePrivateState>) => {
      result: R;
      context: CircuitContext<MintablePrivateState>;
    },
  ): R {
    const { result, context } = fn(this.context);
    this.context = context;
    return result;
  }
}
