export interface ServiceAccountState {
  onCreate(): void;
  onDelete(): void;
}

export interface ServiceAccountTokenState {
  onCreate(): void;
  onDelete(): void;
}
