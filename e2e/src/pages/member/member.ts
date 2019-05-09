import {by, element} from 'protractor';

import {NavPage} from '../shared/nav.po';
import {KMElement} from '../../utils/element';

export class MembersPage extends NavPage {
  navigateTo(): any {
    return KMElement.click(this.getMembersNavButton());
  }

  getAddMemberBtn(): any {
    return element(by.id('km-add-member-top-btn'));
  }

  getAddMemberDialog(): any {
    return element(by.id('km-add-member-dialog'));
  }

  getAddMemberDialogEmailInput(): any {
    return element(by.id('km-add-member-dialog-email-input'));
  }

  getAddMemberDialogGroupCombobox(): any {
    return element(by.id('km-add-member-dialog-group-combobox'));
  }

  getAddMemberDialogGroupOption(optionNr: number): any {
    return element(by.xpath(`//mat-option[${optionNr}]`));
  }

  getAddMemberDialogAddBtn(): any {
    return element(by.id('km-add-member-dialog-add-btn'));
  }

  getMemberDeleteBtn(email: string): any {
    return element(by.id(`km-delete-member-${email}`));
  }

  getMemberItem(email: string): any {
    return element(by.id(`km-member-email-${email}`));
  }

  getMemberGroup(email: string): any {
    return element(by.id(`km-member-group-${email}`));
  }

  getMemberEditBtn(email: string): any {
    return element(by.id(`km-edit-member-${email}`));
  }

  getEditMemberDialogGroupOption(optionNr: number): any {
    return element(by.xpath(`//mat-option[${optionNr}]`));
  }

  getEditMemberDialogEditBtn(): any {
    return element(by.id('km-edit-member-dialog-edit-btn'));
  }

  getEditMemberDialogGroupCombobox(): any {
    return element(by.id('km-edit-member-dialog-group-combobox'));
  }

  getEditMemberDialog(): any {
    return element(by.id('km-edit-member-dialog'));
  }
}
