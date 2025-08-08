export function getPrefixedYearMonth(prefix: string, date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // month is 0-indexed
    return `${prefix}-${year}-${month}`;
  }