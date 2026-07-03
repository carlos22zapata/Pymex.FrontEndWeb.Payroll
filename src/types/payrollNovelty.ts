export interface PayrollNoveltyDto {
  id: number;
  periodCode: string;
  contractId: number;
  contractName?: string;
  payrollVariableId: number;
  variableCode?: string;
  variableName?: string;
  value: number;
}