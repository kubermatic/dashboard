export class PresetListEntity {
  names: string[] = [];

  constructor(...names: string[]) {
    this.names = names;
  }
}
