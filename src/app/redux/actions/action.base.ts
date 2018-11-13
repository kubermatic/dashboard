export class ActionBase {
  protected static readonly className: string = 'ActionBase';

  /**
   * getActType - unites action name with action class name.
   *
   * @static
   * @param  {string} name - action name
   * @return {string}
   */
  static getActType(name: string): string {
    return `${this.className}:${name}`;
  }
}
