/**
 * RIVET - Schema + rule validators for deterministic state
 *
 * Validates that state contains only deterministic values:
 * - NO floats (only integers)
 * - NO Infinity, -Infinity, NaN
 * - NO Map or Set
 * - NO Date objects
 * - NO unsafe integers (outside safe integer range)
 */

/**
 * Validate that a value is deterministic and safe for authoritative state
 *
 * @param value - The value to validate
 * @param path - Current path in the object tree (for error messages)
 * @throws Error if value contains non-deterministic data
 */
export function validateState(value: unknown, path: string = ''): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === 'number') {
    validateNumber(value, path);
    return;
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return;
  }

  if (value instanceof Map) {
    throw new Error(`Map not allowed in authoritative state: ${path || 'root'}`);
  }

  if (value instanceof Set) {
    throw new Error(`Set not allowed in authoritative state: ${path || 'root'}`);
  }

  if (value instanceof Date) {
    throw new Error(`Date object not allowed in authoritative state: ${path || 'root'}`);
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      validateState(value[i], `${path}[${i}]`);
    }
    return;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;
      validateState(obj[key], fieldPath);
    }
    return;
  }

  // BigInt, functions, symbols, etc. are not allowed
  if (typeof value === 'bigint') {
    throw new Error(`BigInt not allowed in authoritative state (convert to string): ${path || 'root'}`);
  }
}

/**
 * Validate a number is deterministic
 */
function validateNumber(n: number, path: string): void {
  if (!Number.isFinite(n)) {
    throw new Error(`Non-finite number not allowed at: ${path || 'root'}`);
  }

  if (!Number.isInteger(n)) {
    throw new Error(`Float values not allowed in authoritative state: ${path || 'root'}`);
  }

  if (!Number.isSafeInteger(n)) {
    throw new Error(`Unsafe integer at: ${path || 'root'} (use BigInt for large values)`);
  }
}

/**
 * Runtime check for non-deterministic values
 *
 * @param value - Value to check
 * @param path - Path for error message
 * @throws Error if value is non-deterministic
 */
export function assertDeterministic(value: unknown, path: string = ''): void {
  validateState(value, path);
}

/**
 * Check if a number is a safe integer
 */
export function assertSafeInteger(n: number, path: string): void {
  if (!Number.isSafeInteger(n)) {
    throw new Error(`Unsafe integer at ${path}: ${n}`);
  }
}

/**
 * Integer division with truncation (for signed values)
 */
export function intDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

/**
 * Integer division with floor (for positive values)
 */
export function intDivFloor(a: number, b: number): number {
  return Math.floor(a / b);
}
