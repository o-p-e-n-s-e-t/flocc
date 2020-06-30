import random from "./random";

function uuid(): Function {
  // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

  const lut: Array<string> = [];

  for (let i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? "0" : "") + i.toString(16);
  }

  return function generate(): string {
    const d0: number = (random(0, 1, true) * 0xffffffff) | 0;
    const d1: number = (random(0, 1, true) * 0xffffffff) | 0;
    const d2: number = (random(0, 1, true) * 0xffffffff) | 0;
    const d3: number = (random(0, 1, true) * 0xffffffff) | 0;

    const uuid =
      lut[d0 & 0xff] +
      lut[(d0 >> 8) & 0xff] +
      lut[(d0 >> 16) & 0xff] +
      lut[(d0 >> 24) & 0xff] +
      "-" +
      lut[d1 & 0xff] +
      lut[(d1 >> 8) & 0xff] +
      "-" +
      lut[((d1 >> 16) & 0x0f) | 0x40] +
      lut[(d1 >> 24) & 0xff] +
      "-" +
      lut[(d2 & 0x3f) | 0x80] +
      lut[(d2 >> 8) & 0xff] +
      "-" +
      lut[(d2 >> 16) & 0xff] +
      lut[(d2 >> 24) & 0xff] +
      lut[d3 & 0xff] +
      lut[(d3 >> 8) & 0xff] +
      lut[(d3 >> 16) & 0xff] +
      lut[(d3 >> 24) & 0xff];

    // .toUpperCase() here flattens concatenated strings to save heap memory space.
    return uuid.toUpperCase();
  };
}

export default uuid();
