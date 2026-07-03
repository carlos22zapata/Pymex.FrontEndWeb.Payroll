export enum ConceptType {
  Earning = 1,
  Deduction = 2,
  Withholding = 3,
  Other = 4,
}

export interface PayrollConceptDto {
  id: number;
  code: string;
  name: string;
  conceptType: ConceptType;
  conceptTypeName?: string;
  isTaxable: boolean;
  formula: string;
  isActive: boolean;
}
