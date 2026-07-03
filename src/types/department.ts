export interface DepartmentDto {
  id: number;
  name: string;
  parentDepartmentId: number | null;
}
