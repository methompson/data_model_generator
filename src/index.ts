import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import { DataModelGenConfig, getConfig } from './data_model/data_model_config';
import {
  DataModel,
  isDataModel,
  isDataModelTest,
} from './shared/data_model_types';
import { isArray } from './shared/type_guards';
import { DataModelGenerator } from './data_model/data_model_generator';
import { outputFilename } from './data_model/data_types';

async function readDataModelFile(
  config: DataModelGenConfig,
  file: string,
): Promise<DataModel[]> {
  const filePath = path.join(config.inDir, file);

  const importedCode = await readFile(filePath, { encoding: 'utf-8' });

  const parsedData = JSON.parse(importedCode);

  const output: DataModel[] = [];

  if (isArray(parsedData)) {
    for (const code of parsedData) {
      if (isDataModel(code)) {
        output.push(code);
      } else {
        throw new Error(`not a data model: ${isDataModelTest(code)}`);
      }
    }
  }

  return output;
}

async function main() {
  const config = await getConfig();

  const inDir = path.join(config.inDir);
  const outDir = path.join(config.outDir);

  const dir = await readdir(inDir);

  const promises: Promise<DataModel[]>[] = [];

  dir.forEach(async (file) => {
    const ext = path.extname(file);

    if (ext === '.json') {
      promises.push(readDataModelFile(config, file));
    }
  });

  const results = await Promise.all(promises);

  const dataModels: DataModel[] = [];
  results.forEach((result) => {
    dataModels.push(...result);
  });

  const dataModelMap: Record<string, DataModel> = {};

  dataModels.forEach((dataModel) => {
    dataModelMap[dataModel.name] = dataModel;
  });

  const gen = new DataModelGenerator(dataModels, outDir);
  const models = gen.compileDataModels();

  for (const [key, value] of Object.entries(models)) {
    const filePath = outputFilename(outDir, key);

    const contents = [];
    if (value.imports.length > 0) {
      contents.push(value.imports);
    }
    if (value.interface.length > 0) {
      contents.push(value.interface);
    }

    contents.push(value.class);

    const fileContents = contents.join('\n\n');

    await writeFile(filePath, fileContents, { encoding: 'utf-8' });
  }

  console.log(models);
}

main();
