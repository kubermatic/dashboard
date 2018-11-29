import 'hammerjs';

import {NgReduxFormModule} from '@angular-redux/form';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatDividerModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatOptionModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule, MatSortModule, MatTabsModule, MatToolbarModule, MatTooltipModule} from '@angular/material';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {CustomFormsModule} from 'ng2-validation';
import {ClipboardModule} from 'ngx-clipboard';

import {AddSshKeyModalComponent} from './components/add-ssh-key-modal/add-ssh-key-modal.component';

const modules: any[] = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  CustomFormsModule,
  SlimLoadingBarModule,
  FlexLayoutModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatSnackBarModule,
  MatToolbarModule,
  MatTooltipModule,
  MatSelectModule,
  MatAutocompleteModule,
  MatCheckboxModule,
  MatMenuModule,
  MatCardModule,
  MatDialogModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatProgressBarModule,
  MatExpansionModule,
  MatSortModule,
  MatDividerModule,
  ClipboardModule,
  NgReduxFormModule,
  MatButtonToggleModule,
  MatTabsModule,
  MatOptionModule,
  MatFormFieldModule,
];

@NgModule({
  imports: [
    ...modules,
  ],
  declarations: [
    AddSshKeyModalComponent,
  ],
  exports: [
    ...modules,
    AddSshKeyModalComponent,
  ],
  entryComponents: [AddSshKeyModalComponent],
})

export class SharedModule {
}
