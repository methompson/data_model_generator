import {
  isRecord,
  isString,
  isStringArray,
  isUndefinedOrNull,
} from '@/shared/type_guards';

export enum Modifier {
  public = 'public',
  private = 'private',
  protected = 'protected',
}

export interface MemberVariableMap {
  [key: string]: {
    type: string[];
    modifier?: Modifier | undefined;
  };
}

export function isMemberVariableMapTest(input: unknown): string[] {
  if (!isRecord(input)) {
    return ['root'];
  }

  const output: string[] = [];

  if (!isStringArray(input.type)) output.push('type');
  if (!isString(input.modifier) && !isUndefinedOrNull(input.modifier))
    output.push('modifier');

  return output;
}

export function isMemberVariableMap(
  input: unknown,
): input is MemberVariableMap {
  return isMemberVariableMapTest(input).length === 0;
}

export interface DataModel {
  name: string;
  memberVariables: MemberVariableMap;
}

export function isDataModelTest(input: unknown): string[] {
  if (!isRecord(input)) {
    return ['root'];
  }

  const output: string[] = [];

  if (!isString(input.name)) output.push('name');
  if (!isRecord(input.memberVariables)) {
    output.push('memberVariables');
  } else {
    for (const [key, value] of Object.entries(input.memberVariables)) {
      if (!isMemberVariableMap(value)) {
        output.push(`memberVariables.${key}`);
      }
    }
  }

  return output;
}

export function isDataModel(input: unknown): input is DataModel {
  return isDataModelTest(input).length === 0;
}
