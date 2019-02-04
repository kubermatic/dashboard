import {by, element} from 'protractor';

import {NavPage} from '../shared/nav.po';

export class ConfirmationDialog extends NavPage {
  private _confirmDialog = by.id('km-confirmation-dialog');
  private _confirmDialogInput = by.id('km-confirmation-dialog-input');
  private _confirmDialogCancelBtn = by.id('km-confirmation-dialog-cancel-btn');
  private _confirmDialogConfirmBtn = by.id('km-confirmation-dialog-confirm-btn');

  navigateTo(): any {
    return this.getProjectsNavButton().click();
  }

  getConfirmationDialog(): any {
    return element(this._confirmDialog);
  }

  getConfirmationDialogInput(): any {
    return element(this._confirmDialogInput);
  }

  getConfirmationDialogCancelBtn(): any {
    return element(this._confirmDialogCancelBtn);
  }

  getConfirmationDialogConfirmBtn(): any {
    return element(this._confirmDialogConfirmBtn);
  }
}
