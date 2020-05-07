export class HetznerTypes {
  standard: Type[];
  dedicated: Type[];

  static newHetznerTypes(): HetznerTypes {
    return {
      standard: [],
      dedicated: [],
    };
  }
}

export class Type {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
}
