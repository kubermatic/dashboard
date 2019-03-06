export class RandomUtils {
  static string(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  static prefixedString(prefix: string): string {
    return `${prefix}-${RandomUtils.string()}`;
  }
}


