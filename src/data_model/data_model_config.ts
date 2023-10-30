import { readFile } from 'fs/promises';
import { isRecord, isString } from '../shared/type_guards';

export interface DataModelGenConfig {
  outDir: string;
  inDir: string;
}

function isDataModelGenConfigTest(input: unknown): string[] {
  if (!isRecord(input)) {
    return ['root'];
  }

  const output: string[] = [];

  if (!isString(input.outDir)) output.push('outDir');
  if (!isString(input.inDir)) output.push('inDir');

  return output;
}

function isDataModelGenConfig(input: unknown): input is DataModelGenConfig {
  return isDataModelGenConfigTest(input).length === 0;
}

export async function getConfig(): Promise<DataModelGenConfig> {
  const config = await readFile('./data_model_gen.json', { encoding: 'utf-8' });

  const configObj = JSON.parse(config);

  if (!isDataModelGenConfig(configObj)) {
    const errors = isDataModelGenConfigTest(configObj);
    throw new Error(`Invalid Config: ${errors}`);
  }

  return configObj;
}
