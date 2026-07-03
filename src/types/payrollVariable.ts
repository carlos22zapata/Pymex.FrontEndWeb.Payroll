export enum DataType {
  Numeric = 1,
  Alphanumeric = 2,
  Date = 3,
}

export enum Behavior {
  Fixed = 1,
  Volatile = 2,
  Calculated = 3,
}

export interface PayrollVariableDto {
  id: number;
  code: string;
  name: string;
  dataType: DataType;
  dataTypeName?: string;
  behavior: Behavior;
  behaviorName?: string;
  isActive: boolean;
  coinId: number;
  coinName?: string;
}
