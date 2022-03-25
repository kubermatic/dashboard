export interface ProjectStrategy {
  onCreate(): void;
  onDelete(): void;
}
