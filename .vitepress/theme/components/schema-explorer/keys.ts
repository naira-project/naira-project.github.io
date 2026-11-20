export const pairKey = (from: string, to: string) => `${from}\u0000${to}`;
export const relationKey = (kind: string, from: string, to: string) =>
  `${kind}\u0000${from}\u0000${to}`;
