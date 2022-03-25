export interface ServiceAccountStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface ServiceAccountTokenStrategy {
  onCreate(): void;
  onDelete(): void;
}
