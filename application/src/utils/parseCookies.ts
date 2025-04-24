export function parseCookies(cookieStr: string): Record<string, string> {
  return cookieStr
    .split(";")
    .map((str) => str.trim().split(/=(.+)/))
    .reduce((acc: Record<string, string>, curr) => {
      const key = curr[0];
      const value = curr[1];
      if (!key || !value) {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
}
