import {Component, NgModule} from '@angular/core';
import {MatDialogModule} from '@angular/material';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {TokenDialogComponent} from '../../serviceaccount/serviceaccount-token/token-dialog/token-dialog.component';

// NoopTokenDialogComponent is only a workaround to trigger change detection
@Component({template: ''})
export class NoopTokenDialogComponent {
}

const TEST_DIRECTIVES = [NoopTokenDialogComponent];

@NgModule({
  imports: [MatDialogModule, NoopAnimationsModule],
  exports: TEST_DIRECTIVES,
  declarations: TEST_DIRECTIVES,
  entryComponents: [
    TokenDialogComponent,
  ],
})
export class TokenDialogTestModule {
}
