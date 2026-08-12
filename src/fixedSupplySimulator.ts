// In-memory simulator for the fixed-supply example issuer.
//
// The fixed-supply token composes the core module alone, with no authorization
// and no witness. It mints its whole supply via a one-shot initialize() after
// deploy and exposes only metadata circuits.
//
// Scope: the in-memory runtime does not surface the minted output, so this
// confirms the token deploys, mints once via initialize(), and reads back
// metadata/color, but not that the coins carry the right color on-chain. That
// needs a live-network test (see the caveat in FixedSupplyUnshieldedToken.compact).

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
} from '../contracts/managed/fixed-supply-unshielded-token/contract/index.js';
import type { Recipient } from './recipient.js';

// This token has no witnesses (the core module declares none).
type EmptyPrivateState = Record<string, never>;

export type FixedSupplyParams = {
  name: string;
  symbol: string;
  decimals: bigint;
  /** 32-byte domain separator; immutable once deployed. */
  domain: Uint8Array;
  /** The whole supply is minted to this recipient at genesis. */
  recipient: Recipient;
  amount: bigint;
  contractAddress?: string;
  coinPublicKey?: string;
};

export class FixedSupplyUnshieldedTokenSimulator {
  readonly contractAddress: string;
  private readonly contract: Contract<EmptyPrivateState>;
  private context: CircuitContext<EmptyPrivateState>;

  constructor(params: FixedSupplyParams) {
    const coinPK = params.coinPublicKey ?? '0'.repeat(64);
    this.contractAddress = params.contractAddress ?? sampleContractAddress();
    // No witnesses: the fixed-supply token uses no authorization at all.
    this.contract = new Contract<EmptyPrivateState>({});

    const init = this.contract.initialState(
      createConstructorContext({}, coinPK),
      params.name,
      params.symbol,
      params.decimals,
      params.domain,
      params.recipient,
      params.amount,
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

  /** One-shot mint of the whole supply. Runs after deploy, so `kernel.self()` is real. */
  initialize(): [] {
    return this.run((ctx) => this.contract.impureCircuits.initialize(ctx));
  }

  private run<R>(
    fn: (ctx: CircuitContext<EmptyPrivateState>) => {
      result: R;
      context: CircuitContext<EmptyPrivateState>;
    },
  ): R {
    const { result, context } = fn(this.context);
    this.context = context;
    return result;
  }
}
