export interface ConceptResultDto {
  payrollConceptId: number;
  conceptCode: string;
  conceptName: string;
  conceptType: number;
  amount: number;
  formula: string;
}

export interface PayrollResultDto {
  employeeId: number;
  employeeName: string;
  concepts: ConceptResultDto[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
}
