export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [k: string]: JsonValue };
export type JsonArray = JsonValue[];

export function isJsonValue(x: unknown): x is JsonValue {
  if (x === null) return true;

  const t = typeof x;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;

  if (Array.isArray(x)) return x.every(isJsonValue);

  if (t === 'object') {
    const rec = Object(x) as Record<string, unknown>;
    return Object.values(rec).every(isJsonValue);
  }

  return false;
}
