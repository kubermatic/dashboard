import { Observable } from 'rxjs/Rx';

import { NodeDeleteConfirmationComponent } from './node-delete-confirmation.component';
import { MdDialogRef, MdDialog, MdDialogConfig } from '@angular/material';
import { Injectable, ViewContainerRef } from '@angular/core';

@Injectable()
export class NodeDeleteConfirmationService {

  constructor(private dialog: MdDialog) { }

  public confirm(title: string, message: string, viewContainerRef: ViewContainerRef, btnOkText: string ='Ok', btnCancelText: string ='Cancel'): Observable<boolean> {

    let dialogRef: MdDialogRef<NodeDeleteConfirmationComponent>;
    let config = new MdDialogConfig();
    config.viewContainerRef = viewContainerRef;

    dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, config);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.btnOkText = btnOkText;
    dialogRef.componentInstance.btnCancelText = btnCancelText;

    return dialogRef.afterClosed();
  }

  public confirmWithoutContainer(title: string, message: string, titleAlign: string='center', messageAlign: string='center', btnOkText: string ='Ok', btnCancelText: string ='Cancel' ): Observable<boolean> {

    let dialogRef: MdDialogRef<NodeDeleteConfirmationComponent>;
    let config = new MdDialogConfig();
    // config.viewContainerRef = viewContainerRef;

    dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, config);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.titleAlign = titleAlign;
    dialogRef.componentInstance.messageAlign = messageAlign;
    dialogRef.componentInstance.btnOkText = btnOkText;
    dialogRef.componentInstance.btnCancelText = btnCancelText;

    return dialogRef.afterClosed();
  }
}
