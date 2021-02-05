import copyArray from "./internal/copyArray";
import random from "./random";
import uniform from "./uniform";

interface SampleFunc {
  <T>(array: T[], weights?: number[]): T;
}

interface MultipleSampleFunc {
  <T>(array: T[], weights?: number[]): T[];
}

let sample: SampleFunc;

/**
 * Gets a random element from `array`.
 * @param {Array} array
 * @returns {*} Returns the random element.
 */
sample = function<T>(array: T[], weights?: number[]): T {
  const length = array ? array.length : 0;
  if (length === 0) return null;

  // if no weights given, return a random value
  if (!weights) return array[random(0, length - 1)];

  // Otherwise, use the `weights` array to tend toward certain values.
  // Normalize the weights array
  let sum = 0;
  const cumulativeWeights = weights.map(w => {
    const value = w + sum;
    sum += w;
    return value;
  });

  const r = uniform();
  for (let i = 0; i < array.length; i++) {
    if (r < cumulativeWeights[i] / sum) return array[i];
  }

  return null;
};

export default sample;

function destructivelySample<T>(array: T[], weights?: number[]): T {
  const length = array ? array.length : 0;
  if (length === 0) return null;

  // if no weights given, return a random value
  if (!weights) {
    const i = random(0, length - 1);
    const output = array[i];
    array.splice(i, 1);
    return output;
  }

  // Otherwise, use the `weights` array to tend toward certain values.
  // Normalize the weights array
  let sum = 0;
  const cumulativeWeights = weights.map(w => {
    const value = w + sum;
    sum += w;
    return value;
  });

  const r = uniform();
  for (let i = 0; i < array.length; i++) {
    if (r < cumulativeWeights[i] / sum) {
      const output = array[i];
      // remove item from array and weights
      array.splice(i, 1);
      weights.splice(i, 1);

      // return the value
      return output;
    }
  }

  return null;
}

export function sampler(n: number): SampleFunc | MultipleSampleFunc {
  // null for invalid value
  if (n < 1) return null;
  // if n = 1, it's just a standard sample
  if (n === 1) return sample;
  return function<T>(array: T[], weights?: number[]): T[] {
    let output: T[];
    const clonedArray = copyArray(array);
    const clonedWeights = weights ? copyArray(weights) : null;
    do {
      const s = destructivelySample(clonedArray, clonedWeights);
      output.push(s);
    } while (output.length < n && clonedArray.length > 0);
    return output;
  };
}
