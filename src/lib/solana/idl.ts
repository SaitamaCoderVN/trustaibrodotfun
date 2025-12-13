// IDL exported as TypeScript to avoid JSON import issues with Turbopack
import { Idl } from '@coral-xyz/anchor';

// Use require for compatibility with Turbopack
// eslint-disable-next-line @typescript-eslint/no-require-imports
const idlData = require('./trustaibro_program.json');

export const IDL = idlData as Idl;

// Helper function to get IDL synchronously
export function getIDLSync(): Idl {
  return IDL;
}
