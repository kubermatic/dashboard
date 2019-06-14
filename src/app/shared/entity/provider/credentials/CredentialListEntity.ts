export class CredentialListEntity {
  names: string[] = [];

  constructor(...names: string[]) {
    this.names = names;
  }
}
