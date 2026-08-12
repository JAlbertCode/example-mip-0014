// Recipient helpers for unshielded operations: `Either<ContractAddress, UserAddress>`.

/** Recipient of an unshielded operation: `Either<ContractAddress, UserAddress>`. */
export type Recipient = {
  is_left: boolean;
  left: { bytes: Uint8Array };
  right: { bytes: Uint8Array };
};

/** Build a recipient that is a `UserAddress` (the common case for holders). */
export const toUser = (bytes: Uint8Array): Recipient => ({
  is_left: false,
  left: { bytes: new Uint8Array(32) },
  right: { bytes },
});

/** Build a recipient that is a `ContractAddress`. */
export const toContract = (bytes: Uint8Array): Recipient => ({
  is_left: true,
  left: { bytes },
  right: { bytes: new Uint8Array(32) },
});

/** The zero `UserAddress`; the core `_mint` must reject it. */
export const ZERO_USER: Recipient = toUser(new Uint8Array(32));
