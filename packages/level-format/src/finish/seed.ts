/** The FNV-1a 32-bit offset basis and prime. */
const FNV_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** The two multipliers of MurmurHash3's 32-bit finaliser. */
const MIX_1 = 0x85ebca6b;
const MIX_2 = 0xc2b2ae35;

/** The bits a 32-bit hash keeps for a seed: the top 12. */
const SEED_SHIFT = 20;

/**
 * The seed of an id, from 0 to 4,095: the top 12 bits of the id's FNV-1a 32-bit hash over
 * its UTF-16 code units, mixed by MurmurHash3's finaliser so that ids differing in one
 * character spread like random seeds. A seed sets a look, so the function never changes.
 */
export function seedOfId(id: string): number {
  let hash = FNV_BASIS;
  for (let i = 0; i < id.length; i += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(i), FNV_PRIME);
  }
  hash = Math.imul(hash ^ (hash >>> 16), MIX_1);
  hash = Math.imul(hash ^ (hash >>> 13), MIX_2);
  return (hash ^ (hash >>> 16)) >>> SEED_SHIFT;
}
