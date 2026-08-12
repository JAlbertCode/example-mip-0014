import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MintableUnshieldedTokenSimulator,
  type SimulatorParams,
  toUser,
  ZERO_USER,
} from '../src/index.js';

const bytes32 = (fill?: number): Uint8Array =>
  fill === undefined ? new Uint8Array(randomBytes(32)) : new Uint8Array(32).fill(fill);

const MINTER_SECRET = bytes32(7);
const DOMAIN = bytes32(1);

const baseParams = (): SimulatorParams => ({
  name: 'Example Token',
  symbol: 'EXTKN',
  decimals: 6n,
  domain: DOMAIN,
  minterSecret: MINTER_SECRET,
});

const isAllZero = (b: Uint8Array): boolean => b.every((x) => x === 0);

describe('mintable native unshielded token', () => {
  let token: MintableUnshieldedTokenSimulator;

  beforeEach(() => {
    token = new MintableUnshieldedTokenSimulator(baseParams());
  });

  describe('construction and metadata', () => {
    it('returns the constructor metadata values', () => {
      expect(token.name()).toBe('Example Token');
      expect(token.symbol()).toBe('EXTKN');
      expect(token.decimals()).toBe(6n);
    });
  });

  describe('color derivation, tokenType(domain, issuerAddress)', () => {
    it('derives a 32-byte, non-zero color at runtime', () => {
      const color = token.tokenColor();
      expect(color).toHaveLength(32);
      expect(isAllZero(color)).toBe(false);
    });

    it('is deterministic for a fixed (domain, issuer address)', () => {
      expect(token.tokenColor()).toEqual(token.tokenColor());
    });

    it('changes when the domain changes', () => {
      const other = new MintableUnshieldedTokenSimulator({ ...baseParams(), domain: bytes32(2) });
      expect(token.tokenColor()).not.toEqual(other.tokenColor());
    });

    it('changes when the issuer address changes (same domain)', () => {
      const a = new MintableUnshieldedTokenSimulator(baseParams());
      const b = new MintableUnshieldedTokenSimulator(baseParams());
      expect(a.tokenColor()).not.toEqual(b.tokenColor());
    });
  });

  describe('mint', () => {
    it('returns a color equal to tokenColor(domain)', () => {
      const color = token.mint(toUser(bytes32(9)), 1_000n);
      expect(color).toEqual(token.tokenColor());
    });

    it('reverts on a zero recipient', () => {
      expect(() => token.mint(ZERO_USER, 1_000n)).toThrow(/zero address/);
    });
  });

  describe('mint authorization (committed secret)', () => {
    it('succeeds for a caller proving the committed secret', () => {
      expect(() => token.mint(toUser(bytes32(9)), 1_000n)).not.toThrow();
    });

    it('fails for a wrong secret', () => {
      token.setMinterSecret(bytes32(0xff));
      expect(() => token.mint(toUser(bytes32(9)), 1_000n)).toThrow(/only minter/);
    });

    it('gates burn as well', () => {
      token.setMinterSecret(bytes32(0xff));
      expect(() => token.burn(100n)).toThrow(/only minter/);
    });
  });
});
