export interface CoinsDto {
  id: number;
  name: string;
  symbol: string;
  enabled: boolean;
  idWeb: string;
}

export interface CoinQuotationDto {
  id: number;
  date: string;
  observation: string;
  value: number;
  coinId: number;
  origin: number;
  coinName?: string;
  coinSymbol?: string;
}
