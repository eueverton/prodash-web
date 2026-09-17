export type RankingEntry = {
  id: number;
  piloto: string;
  carro: string;
  modalidade: string;
  tempo: number;
  csv_data?: string | null;
  created_at?: string;
};

export type StorageFileItem = {
  name: string;
  created_at?: string;
  metadata?: { size?: number } | null;
};
