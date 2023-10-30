export function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === 'object' && !Array.isArray(input);
}

export function isArray(input: unknown): input is Array<unknown> {
  return Array.isArray(input);
}

export function isUndefined(input: unknown): input is undefined {
  return input === undefined;
}

export function isNull(input: unknown): input is null {
  return input === null;
}

export function isString(input: unknown): input is string {
  return typeof input === 'string';
}

export function isStringArray(input: unknown): input is string[] {
  if (!isArray(input)) {
    return false;
  }

  for (const val of input) {
    if (!isString(val)) {
      return false;
    }
  }

  return true;
}

export function isUndefinedOrNull(input: unknown): input is null | undefined {
  return isNull(input) || isUndefined(input);
}
