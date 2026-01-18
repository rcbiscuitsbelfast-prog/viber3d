/**
 * Seeded Random Number Generator
 * Provides deterministic random numbers based on a seed value
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
 * Generate next random number and advance seed
 * Uses a simple but effective LCG (Linear Congruential Generator)
 */
  private next(): number {
    // LCG parameters (using constants from glibc)
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }

  /**
 * Random float between 0 and 1
 */
  random(): number {
    return this.next();
  }

  /**
 * Random float between min and max
 */
  randomRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
 * Random integer between min and max (inclusive)
 */
  randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }

  /**
 * Random boolean with given probability
 */
  randomBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
 * Pick random item from array
 */
  pick<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }

  /**
 * Shuffle array in place
 */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
 * Create new SeededRandom with derived seed
 * Useful for different aspects of generation
 */
  fork(): SeededRandom {
    return new SeededRandom(Math.floor(this.next() * 2147483648));
  }
}