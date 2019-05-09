import {KMElement} from './element';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';

export class ConfirmationUtils {
  private static _confirmationDialog = new ConfirmationDialog();

  static async confirm() {
    await KMElement.waitToAppear(ConfirmationUtils._confirmationDialog.getConfirmationDialog());
    await KMElement.click(ConfirmationUtils._confirmationDialog.getConfirmationDialogConfirmBtn());
    await KMElement.waitToDisappear(ConfirmationUtils._confirmationDialog.getConfirmationDialog());
  }
}
