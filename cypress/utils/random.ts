export function randomString(): string {
  return Math.random().toString(36).substring(2,15);
}

export function prefixedString(prefix: string): string {
  return `${prefix}-${randomString()}`;
}
