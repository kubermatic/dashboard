export function RandomString(length): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
  let result = '';

  while (length > 0) {
    const bytes = new Uint8Array(16);
    const random = window.crypto.getRandomValues(bytes);

    random.forEach((c) => {
      if (length === 0) {
        return;
      }
      if (c < charset.length) {
        result += charset[c];
        length--;
      }
    });
  }
  return result;
}
