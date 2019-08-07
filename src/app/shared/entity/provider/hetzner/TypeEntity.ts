export class HetznerTypes {
  standard: Type[];
  dedicated: Type[];
}

export class Type {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
}
