export interface RelatedContractDto {
  id: number;
  contractId: number;
  contractName?: string;
  relatedContractId: number;
  relatedContractName?: string;
  description?: string;
  isActive: boolean;
}
