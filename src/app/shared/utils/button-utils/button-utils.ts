export class ButtonUtils {
  static getButtonWrapperClass(isDisabled: boolean): string {
    return !!isDisabled ? 'km-button-wrapper disabled' : 'km-button-wrapper';
  }
}
