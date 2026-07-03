import type { DataType, Behavior } from './payrollVariable';

export interface ContractVariableDto {
  id: number;
  contractId: number;
  contractName?: string;
  payrollVariableId: number;
  variableCode?: string;
  variableName?: string;
  dataType: DataType;
  behavior: Behavior;
  value: number;
  stringValue?: string;
  coinId: number;
  coinName?: string;
}