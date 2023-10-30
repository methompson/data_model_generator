import path from 'path';

import { arrayToMap } from '@/shared/array_to_map';

interface BuiltInType {
  name: string;
  typeguard: (input: unknown) => boolean;
  typeguardStr: string;
}

export const scalarTypes: BuiltInType[] = [
  {
    name: 'string',
    typeguard: (input: unknown): input is string => typeof input === 'string',
    typeguardStr: ` (input: unknown): input is string => typeof input === 'string'`,
  },
  {
    name: 'String',
    typeguard: (input: unknown): input is string => input instanceof String,
    typeguardStr: ` (input: unknown): input is string => input instanceof String`,
  },
  {
    name: 'number',
    typeguard: (input: unknown): input is number => typeof input === 'number',
    typeguardStr: ` (input: unknown): input is number => typeof input === 'number'`,
  },
  {
    name: 'Number',
    typeguard: (input: unknown): input is number => input instanceof Number,
    typeguardStr: ` (input: unknown): input is number => input instanceof Number`,
  },
  {
    name: 'boolean',
    typeguard: (input: unknown): input is boolean => typeof input === 'boolean',
    typeguardStr: ` (input: unknown): input is boolean => typeof input === 'boolean'`,
  },
  {
    name: 'Boolean',
    typeguard: (input: unknown): input is boolean => input instanceof Boolean,
    typeguardStr: ` (input: unknown): input is boolean => input instanceof Boolean`,
  },
  {
    name: 'BigInt',
    typeguard: (input: unknown): input is bigint => typeof input === 'bigint',
    typeguardStr: ` (input: unknown): input is bigint => typeof input === 'bigint'`,
  },
  {
    name: 'Symbol',
    typeguard: (input: unknown): input is Symbol => typeof input === 'symbol',
    typeguardStr: ` (input: unknown): input is Symbol => typeof input === 'symbol'`,
  },
  {
    name: 'null',
    typeguard: (input: unknown): input is null => typeof input === null,
    typeguardStr: ` (input: unknown): input is null => typeof input === null`,
  },
  {
    name: 'undefined',
    typeguard: (input: unknown): input is undefined =>
      typeof input === undefined,
    typeguardStr: ` (input: unknown): input is undefined => typeof input === undefined`,
  },
];

export const scalarTypeMap = arrayToMap(scalarTypes, (i) => i.name);

export const jsObjectTypes: BuiltInType[] = [
  {
    name: 'Date',
    typeguard: (input: unknown): input is Date => input instanceof Date,
    typeguardStr: ` (input: unknown): input is Date => input instanceof Date`,
  },
  {
    name: 'Set',
    typeguard: (input: unknown): input is Set<unknown> => input instanceof Set,
    typeguardStr: ` (input: unknown): input is Set<unknown> => input instanceof Set`,
  },
  {
    name: 'Date',
    typeguard: (input: unknown): input is Date => input instanceof Date,
    typeguardStr: ` (input: unknown): input is Date => input instanceof Date`,
  },
  {
    name: 'Array',
    typeguard: (input: unknown): input is Array<unknown> =>
      Array.isArray(input),
    typeguardStr: ` (input: unknown): input is Array<unknown> => Array.isArray(input)`,
  },
  {
    name: 'Object',
    typeguard: (input: unknown): input is Record<string, unknown> =>
      !!input && typeof input === 'object' && !Array.isArray(input),
    typeguardStr: `(input: unknown): input is Record<string, unknown> =>
      !!input && typeof input === 'object' && !Array.isArray(input)`,
  },
];

export const jsObjectTypesMap = arrayToMap(jsObjectTypes, (i) => i.name);

export function outputFilename(outDir: string, dataModelName: string): string {
  return path.join(outDir, `${dataModelName}.g.ts`);
}
