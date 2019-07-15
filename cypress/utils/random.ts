export function randomString() {
  return Math.random().toString(36).substring(2,15);
}

export function prefixedString(prefix: string) {
  return `${prefix}-${randomString()}`;
}
