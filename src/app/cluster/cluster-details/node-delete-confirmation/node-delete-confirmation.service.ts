import { Injectable, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Observable } from 'rxjs';
import { NodeDeleteConfirmationComponent } from './node-delete-confirmation.component';

@Injectable()
export class NodeDeleteConfirmationService {

  constructor(private dialog: MatDialog) {
  }

  public confirm(title: string,
                 message: string,
                 viewContainerRef: ViewContainerRef,
                 btnOkText: string = 'Ok',
                 btnCancelText: string = 'Cancel'): Observable<boolean> {

    const config: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      backdropClass: '',
      width: '',
      height: '',
      position: {
        top: '',
        bottom: '',
        left: '',
        right: '',
      },
      data: {
        message: 'Jazzy jazz jazz',
      },
    };

    config.viewContainerRef = viewContainerRef;

    const dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, config);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.btnOkText = btnOkText;
    dialogRef.componentInstance.btnCancelText = btnCancelText;

    return dialogRef.afterClosed();
  }

  public confirmWithoutContainer(title: string,
                                 message: string,
                                 titleAlign: string = 'center',
                                 messageAlign: string = 'center',
                                 btnOkText: string = 'Ok',
                                 btnCancelText: string = 'Cancel'): Observable<boolean> {

    const config = new MatDialogConfig();
    // config.viewContainerRef = viewContainerRef;

    const dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, config);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.titleAlign = titleAlign;
    dialogRef.componentInstance.messageAlign = messageAlign;
    dialogRef.componentInstance.btnOkText = btnOkText;
    dialogRef.componentInstance.btnCancelText = btnCancelText;

    return dialogRef.afterClosed();
  }
}
