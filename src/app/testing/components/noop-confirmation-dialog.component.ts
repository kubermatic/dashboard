import {Component, NgModule} from '@angular/core';
import {MatDialogModule} from '@angular/material';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

// NoopConfirmDialogComponent is only a workaround to trigger change detection
@Component({template: ''})
export class NoopConfirmDialogComponent {
}

const TEST_DIRECTIVES = [NoopConfirmDialogComponent];

@NgModule({
  imports: [MatDialogModule, NoopAnimationsModule],
  exports: TEST_DIRECTIVES,
  declarations: TEST_DIRECTIVES,
  entryComponents: [
    ConfirmationDialogComponent,
  ],
})
export class DialogTestModule {
}
