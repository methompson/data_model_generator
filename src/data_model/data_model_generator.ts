import { arrayToMap } from '@/shared/array_to_map';
import { DataModel } from '@/shared/data_model_types';
import { isUndefinedOrNull } from '@/shared/type_guards';
import {
  jsObjectTypes,
  jsObjectTypesMap,
  scalarTypeMap,
  scalarTypes,
} from '@/data_model/data_types';

interface DataModelOutput {
  class: string;
  interface: string;
  imports: string;
}

export class DataModelGenerator {
  protected indentLevel: number = 0;
  protected simpleDataModels: Record<string, DataModel> = {};
  protected complexDataModels: Record<string, DataModel> = {};

  constructor(
    protected dataModels: DataModel[],
    protected outputDirectory: string,
  ) {
    const dataModelMap = this.compileModelNames(dataModels);
    const dataModelCheck = this.checkMemberVariables(dataModelMap);

    console.log('complex data models', dataModelCheck.complexDataModels);

    this.simpleDataModels = arrayToMap(
      dataModelCheck.simpleDataModels,
      (i) => i.name,
    );
    this.complexDataModels = arrayToMap(
      dataModelCheck.complexDataModels,
      (i) => i.name,
    );
  }

  get indent(): string {
    return this.makeIndent(this.indentLevel);
  }

  get allDataModels(): Record<string, DataModel> {
    return {
      ...this.simpleDataModels,
      ...this.complexDataModels,
    };
  }

  makeIndent(indentLevel: number): string {
    let output = '';

    for (let i = 0; i < indentLevel; i++) {
      output += '  ';
    }

    return output;
  }

  indentRight() {
    this.indentLevel++;
  }

  indentLeft() {
    this.indentLevel--;
  }

  jsonInterfaceName(dataModel: DataModel): string {
    return `${dataModel.name}JSON`;
  }

  compileDataModels(): Record<string, DataModelOutput> {
    const output: Record<string, DataModelOutput> = {};

    // Create the simple ones first
    Object.values(this.simpleDataModels).forEach((dataModel) => {
      const imports = this.importCreation(dataModel);
      const interfaceStr = this.interfaceCreation(dataModel);
      const classStr = this.classCreation(dataModel);

      output[dataModel.name] = {
        class: classStr,
        interface: interfaceStr,
        imports,
      };
    });

    // Then the complex ones
    Object.values(this.complexDataModels).forEach((dataModel) => {
      const imports = this.importCreation(dataModel);
      const interfaceStr = this.interfaceCreation(dataModel);
      const classStr = this.classCreation(dataModel);

      console.log({ imports });

      output[dataModel.name] = {
        class: classStr,
        interface: interfaceStr,
        imports,
      };
    });

    return output;
  }

  compileModelNames(dataModels: DataModel[]): Record<string, DataModel> {
    const dataModelMap: Record<string, DataModel> = {};

    for (const dataModel of dataModels) {
      // If we have a duplicate, we'll just throw.
      if (!isUndefinedOrNull(dataModelMap[dataModel.name])) {
        throw new Error(`Duplicate data model name: ${dataModel.name}`);
      }

      dataModelMap[dataModel.name] = dataModel;
    }

    return dataModelMap;
  }

  checkMemberVariables(dataModelsMap: Record<string, DataModel>): {
    simpleDataModels: DataModel[];
    complexDataModels: DataModel[];
  } {
    const scalarMap = arrayToMap(scalarTypes, (i) => i.name);
    const jsObjectMap = arrayToMap(jsObjectTypes, (i) => i.name);

    const simpleDataModels: DataModel[] = [];
    const complexDataModels: DataModel[] = [];

    // Data Model List
    for (const dataModel of Object.values(dataModelsMap)) {
      let complex = false;

      // Member Variable List
      for (const [name, value] of Object.entries(dataModel.memberVariables)) {
        // Member Variable Type List
        for (const type of value.type) {
          if (
            !isUndefinedOrNull(scalarMap[type]) ||
            !isUndefinedOrNull(jsObjectMap[type])
          ) {
            // Do nothing?
          } else if (!isUndefinedOrNull(dataModelsMap[type])) {
            if (type === dataModel.name) {
              throw new Error('Cannot have a member variable of the same type');
            }
            complex = true;
            // console.log(`${type} type exists`);
          } else {
            throw new Error(`${type} type does not exist`);
          }
        }
      }

      if (complex) {
        complexDataModels.push(dataModel);
      } else {
        simpleDataModels.push(dataModel);
      }
    }

    return { simpleDataModels, complexDataModels };
  }

  interfaceCreation(dataModel: DataModel): string {
    const output: string[] = [];

    output.push(`export interface ${this.jsonInterfaceName(dataModel)} {`);

    this.indentRight();

    for (const [name, value] of Object.entries(dataModel.memberVariables)) {
      output.push(`${this.indent}${name}: ${value.type.join(' | ')};`);
    }

    this.indentLeft();

    output.push(`}`);

    return output.join('\n');
  }

  importCreation(dataModel: DataModel): string {
    const isComplex = !isUndefinedOrNull(
      this.complexDataModels[dataModel.name],
    );

    console.log(dataModel.name, { isComplex });

    if (!isComplex) {
      return '';
    }

    const output: string[] = [];

    for (const variable of Object.values(dataModel.memberVariables)) {
      for (const type of variable.type) {
        if (!isUndefinedOrNull(this.allDataModels[type])) {
          let filePath = `./${type}.g`;

          output.push(`import { ${type} } from '${filePath}';`);
        }
      }
    }

    return output.join('\n');
  }

  classCreation(dataModel: DataModel): string {
    const output: string[] = [];

    output.push(`export class ${dataModel.name} {`);

    this.indentRight();

    output.push(...this.createConstructor(dataModel));
    output.push(...this.createGetters(dataModel));
    output.push(...this.createToJSON(dataModel));
    output.push(...this.createFromJSON(dataModel));
    output.push(...this.isDataModel(dataModel));
    output.push(...this.isDataModelTest(dataModel));

    this.indentLeft();

    // End of class
    output.push(`}`);

    return output.join('\n');
  }

  createConstructor(dataModel: DataModel): string[] {
    const output: string[] = [];

    // Constructor
    output.push(`${this.indent}constructor(`);

    this.indentRight();
    for (const [name, value] of Object.entries(dataModel.memberVariables)) {
      const modifier = value.modifier ?? 'protected';

      const varName = modifier === 'public' ? name : `_${name}`;

      output.push(
        `${this.indent}${modifier} ${varName}: ${value.type.join(' | ')},`,
      );
    }

    this.indentLeft();
    // End of constructor
    output.push(`${this.indent}) {}`);

    return output;
  }

  createGetters(dataModel: DataModel): string[] {
    const output: string[] = [];

    for (const [name, value] of Object.entries(dataModel.memberVariables)) {
      const modifier = value.modifier ?? 'protected';

      if (modifier !== 'public') {
        const varName = `_${name}`;

        output.push(`${this.indent}get ${name}(): ${value.type.join(' | ')} {`);
        this.indentRight();
        output.push(`${this.indent}return this.${varName};`);
        this.indentLeft();
        output.push(`${this.indent}}`);
      }
    }

    return output;
  }

  createToJSON(dataModel: DataModel): string[] {
    const output: string[] = [];

    output.push(
      `${this.indent}toJSON(): ${this.jsonInterfaceName(dataModel)} {`,
    );

    this.indentRight();

    output.push(`${this.indent}return {`);

    this.indentRight();

    for (const name of Object.keys(dataModel.memberVariables)) {
      output.push(`${this.indent}${name}: this.${name},`);
    }

    this.indentLeft();
    output.push(`${this.indent}}`);

    this.indentLeft();
    output.push(`${this.indent}}`);

    return output;
  }

  createFromJSON(dataModel: DataModel): string[] {
    const output: string[] = [];

    output.push(
      `${this.indent}static fromJSON(input: ${this.jsonInterfaceName(
        dataModel,
      )}): ${dataModel.name} {`,
    );

    this.indentRight();

    output.push(`${this.indent}if (!${dataModel.name}.isDataModel(input)) {`);
    this.indentRight();

    output.push(
      `${this.indent}throw new Error(\`not a data model: \${${dataModel.name}.isDataModelTest(input)}\`);`,
    );

    this.indentLeft();
    output.push(`${this.indent}}`);

    output.push(`${this.indent}return new ${dataModel.name}(`);
    this.indentRight();

    for (const [name, value] of Object.entries(dataModel.memberVariables)) {
      output.push(`${this.indent}input.${name},`);
    }

    this.indentLeft();
    output.push(`${this.indent});`);

    this.indentLeft();
    output.push(`${this.indent}}`);

    return output;
  }

  isDataModel(dataModel: DataModel): string[] {
    const output: string[] = [];

    output.push(
      `${this.indent}static isDataModel(input: unknown): input is ${dataModel.name} {`,
    );

    this.indentRight();

    output.push(
      `${this.indent}return ${dataModel.name}.isDataModelTest(input).length === 0;`,
    );

    this.indentLeft();

    output.push(`${this.indent}}`);

    return output;
  }

  isDataModelTest(dataModel: DataModel): string[] {
    const output: string[] = [];

    output.push(
      `${this.indent}static isDataModelTest(input: unknown): string[] {`,
    );
    this.indentRight();

    const generatedDataModels = {
      ...this.simpleDataModels,
      ...this.complexDataModels,
    };

    // Record check
    output.push(
      `${this.indent}if (!(${jsObjectTypesMap['Object'].typeguardStr})(input)) {`,
    );
    this.indentRight();
    output.push(`${this.indent}return ['root'];`);
    this.indentLeft();
    output.push(`${this.indent}}`);

    output.push(`${this.indent}const output: string[] = [];`);

    for (const [name, value] of Object.entries(dataModel.memberVariables)) {
      // The variables
      output.push(`${this.indent}if(`);

      let index = 0;
      const typeLength = value.type.length;

      for (const type of Object.values(value.type)) {
        // The Types
        const end = index === typeLength - 1 ? '' : ' &&';
        this.indentRight();

        if (!isUndefinedOrNull(generatedDataModels[type])) {
          // Generated type. use the isDataModelTest function
          output.push(
            `${this.indent}!${type}.isDataModelTest(input.${name})${end}`,
          );

          console.log('complex Data Model JSON validation test needed', type);
        } else if (!isUndefinedOrNull(scalarTypeMap[type])) {
          // Simple type. use the typeguard
          const typeguard = scalarTypeMap[type].typeguardStr;
          output.push(`${this.indent}!(${typeguard})(input.${name})${end}`);

          console.log('scalar JSON validation test needed', type);
        } else if (!isUndefinedOrNull(jsObjectTypesMap[type])) {
          const typeguard = jsObjectTypesMap[type].typeguardStr;
          output.push(`${this.indent}!(${typeguard})(input.${name})${end}`);

          console.log('js object JSON validation test needed', type);
        }

        this.indentLeft();

        index++;
      }

      output.push(`${this.indent}) {`);
      this.indentRight();
      output.push(`${this.indent}output.push('${name}');`);
      this.indentLeft();
      output.push(`${this.indent}}`);
    }

    output.push(`${this.indent}return output;`);

    this.indentLeft();
    output.push(`${this.indent}}`);

    return output;
  }
}
