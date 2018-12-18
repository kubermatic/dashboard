import {NavPage} from "../shared/nav.po";
import {by, element} from "protractor";

export class MembersPage extends NavPage {
  private _addMemberTopBtn = by.id('km-add-member-top-btn');
  private _addMemberDialog = by.id('km-add-member-dialog');
  private _addMemberDialogEmailInput = by.id('km-add-member-dialog-email-input');
  private _addMemberDialogGroupCombobox = by.id('km-add-member-dialog-group-combobox');
  private _addMemberDialogAddBtn = by.id('km-add-member-dialog-add-btn');
  private _deleteMemberDialogBtn = by.id('km-delete-member-dialog-btn');
  private _deleteMemberDialog = by.id('km-delete-member-dialog');
  private _editMemberDialogEditBtn = by.id('km-edit-member-dialog-edit-btn');
  private _editMemberDialogGroupCombobox = by.id('km-edit-member-dialog-group-combobox');
  private _editMemberDialog = by.id('km-edit-member-dialog');

  private _getMemberItemPath(email: string): any {
    return `//kubermatic-member-item//*[normalize-space()="${email}"]`;
  }

  navigateTo(): any {
    return this.getMembersNavButton().click();
  }

  getAddMemberBtn(): any {
    return element(this._addMemberTopBtn);
  }

  getAddMemberDialog(): any {
    return element(this._addMemberDialog);
  }

  getAddMemberDialogEmailInput(): any {
    return element(this._addMemberDialogEmailInput);
  }

  getAddMemberDialogGroupCombobox(): any {
    return element(this._addMemberDialogGroupCombobox);
  }

  getAddMemberDialogGroupOption(optionNr: number): any {
    return element(by.xpath(`//mat-option[${optionNr}]`));
  }

  getAddMemberDialogAddBtn(): any {
    return element(this._addMemberDialogAddBtn);
  }

  getMemberDeleteBtn(email: string): any {
    return element(by.xpath(`${this._getMemberItemPath(email)}//..//button[2]`));
  }

  getMemberItem(email: string): any {
    return element(by.xpath(this._getMemberItemPath(email)));
  }

  getMemberGroup(email: string): any {
    return element(by.xpath(`${this._getMemberItemPath(email)}//..//*[contains(@class,'member-group')]`));
  }

  getDeleteMemberDialog(): any {
    return element(this._deleteMemberDialog);
  }

  getDeleteMemberDialogBtn(): any {
    return element(this._deleteMemberDialogBtn);
  }

  getMemberEditBtn(email: string): any {
    return element(by.xpath(`${this._getMemberItemPath(email)}//..//button[1]`));
  }

  getEditMemberDialogGroupOption(optionNr: number): any {
    return element(by.xpath(`//mat-option[${optionNr}]`));
  }

  getEditMemberDialogEditBtn(): any {
    return element(this._editMemberDialogEditBtn);
  }

  getEditMemberDialogGroupCombobox(): any {
    return element(this._editMemberDialogGroupCombobox);
  }

  getEditMemberDialog(): any {
    return element(this._editMemberDialog);
  }
}