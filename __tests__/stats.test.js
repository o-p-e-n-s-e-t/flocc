/**
 * Test stats functions (sum, mean, standard deviation).
 */

const { utils } = require("../dist/flocc");
const { sum, max, min, median, mean, stdDev } = utils;

it("Correctly sums an array.", () => {
  expect(sum([1])).toBe(1);
  expect(sum([1, 2, 3])).toBe(6);
});

it("Correctly finds the mean value of an array.", () => {
  expect(mean([1])).toBe(1);
  expect(mean([1, 2, 3])).toBe(2);
});

it("Correctly finds the standard deviation of an array.", () => {
  expect(stdDev([3, 3, 3, 3, 3])).toBeCloseTo(0);
  expect(stdDev([6, 2, 3, 1])).toBeCloseTo(1.87);
});

it("Correctly finds max, min, and median values.", () => {
  const arr1 = [5, 100, 2, 3, 4];
  const arr2 = [4, 1, 2, 3];
  expect(min(arr1)).toBe(2);
  expect(max(arr1)).toBe(100);
  expect(median(arr1)).toBe(4);
  expect(median(arr2)).toBe(2.5);
});

it("Returns predictable values for empty arrays.", () => {
  expect(sum([])).toBe(0);
  expect(max([])).toBeNull();
  expect(min([])).toBeNull();
  expect(median([])).toBeNull();
  expect(mean([])).toBeNull();
  expect(stdDev([])).toBeNull();
});
