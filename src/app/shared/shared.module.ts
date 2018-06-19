import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CustomFormsModule } from 'ng2-validation';
import { ClipboardModule } from 'ngx-clipboard';
import { MatButtonModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatExpansionModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule, MatSortModule, MatToolbarModule, MatTooltipModule } from '@angular/material';
import 'hammerjs';
import { NgReduxFormModule } from '@angular-redux/form';
import { AddSshKeyModalComponent } from './components/add-ssh-key-modal/add-ssh-key-modal.component';
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';

const modules: Array<any> = [
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
  MatCheckboxModule,
  MatMenuModule,
  MatCardModule,
  MatDialogModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatProgressBarModule,
  MatExpansionModule,
  MatSortModule,
  ClipboardModule,
  NgReduxFormModule
];

@NgModule({
  imports: [
    ...modules
  ],
  declarations: [
    AddSshKeyModalComponent,
    ThemePickerComponent
  ],
  exports: [
    ...modules,
    AddSshKeyModalComponent,
    ThemePickerComponent,
  ],
  entryComponents: [AddSshKeyModalComponent]
})

export class SharedModule {
}
