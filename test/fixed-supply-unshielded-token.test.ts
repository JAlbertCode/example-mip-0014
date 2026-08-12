import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { FixedSupplyUnshieldedTokenSimulator, type FixedSupplyParams } from '../src/fixedSupplySimulator.js';
import { toUser } from '../src/index.js';

const bytes32 = (fill?: number): Uint8Array =>
  fill === undefined ? new Uint8Array(randomBytes(32)) : new Uint8Array(32).fill(fill);

const baseParams = (): FixedSupplyParams => ({
  name: 'Fixed Token',
  symbol: 'FIX',
  decimals: 6n,
  domain: bytes32(1),
  recipient: toUser(bytes32(9)),
  amount: 1_000_000n,
});

const isAllZero = (b: Uint8Array): boolean => b.every((x) => x === 0);

// A fixed-supply issuer composes the core module alone: no authorization, no
// witness. The supply is minted by a one-shot `initialize()` after deploy (not in
// the constructor, where `kernel.self()` is a placeholder).
describe('fixed-supply native unshielded token (no authorization)', () => {
  let token: FixedSupplyUnshieldedTokenSimulator;

  beforeEach(() => {
    token = new FixedSupplyUnshieldedTokenSimulator(baseParams());
  });

  it('returns the constructor metadata values', () => {
    expect(token.name()).toBe('Fixed Token');
    expect(token.symbol()).toBe('FIX');
    expect(token.decimals()).toBe(6n);
  });

  it('derives a 32-byte, non-zero color at runtime', () => {
    const color = token.tokenColor();
    expect(color).toHaveLength(32);
    expect(isAllZero(color)).toBe(false);
  });

  it('gives distinct colors to distinct deployments (same domain)', () => {
    const other = new FixedSupplyUnshieldedTokenSimulator(baseParams());
    expect(token.tokenColor()).not.toEqual(other.tokenColor());
  });

  it('mints once via initialize, with no authorization', () => {
    expect(() => token.initialize()).not.toThrow();
  });

  it('rejects a second initialize (one-shot)', () => {
    token.initialize();
    expect(() => token.initialize()).toThrow(/already minted/);
  });
});
