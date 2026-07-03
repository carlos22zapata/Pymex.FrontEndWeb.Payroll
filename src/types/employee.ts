export interface EmployeeDto {
  id: number;
  employeeCode: string;
  name: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  hireDate: string;
  terminationDate?: string | null;
  contractId: number;
  contractName?: string;
  departmentId: number;
  departmentName?: string;
  positionId: number;
  positionName?: string;
  isActive?: boolean;
}
