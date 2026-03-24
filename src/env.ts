export function env(key: string) {
  return (process.env[key] ?? '').trim();
}

export function mustEnv(key: string): string {
  const v = env(key);
  if (!v) throw new Error(`${key} is required`);
  return v;
}
