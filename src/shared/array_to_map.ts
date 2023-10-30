export function arrayToMap<T>(
  input: T[],
  keygen: (input: T) => string | number,
): Record<string | number, T> {
  const output: Record<string | number, T> = {};

  for (const i of input) {
    output[keygen(i)] = i;
  }

  return output;
}
