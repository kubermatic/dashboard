import 'hammerjs';

import {NgReduxFormModule} from '@angular-redux/form';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatDialogModule, MatDividerModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatOptionModule, MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule, MatSortModule, MatTableModule, MatTabsModule, MatToolbarModule, MatTooltipModule} from '@angular/material';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {CustomFormsModule} from 'ng2-validation';
import {ClipboardModule} from 'ngx-clipboard';

import {AddProjectDialogComponent} from './components/add-project-dialog/add-project-dialog.component';
import {AddSshKeyDialogComponent} from './components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {ConfirmationDialogComponent} from './components/confirmation-dialog/confirmation-dialog.component';
import {DialogTitleComponent} from './components/dialog-title/dialog-title.component';
import {EventListComponent} from './components/event-list/event-list.component';
import {LabelFormComponent} from './components/label-form/label-form.component';
import {LabelsComponent} from './components/labels/labels.component';
import {PropertyComponent} from './components/property/property.component';
import {TaintFormComponent} from './components/taint-form/taint-form.component';
import {TaintsComponent} from './components/taints/taints.component';

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
  MatChipsModule,
  MatCardModule,
  MatDialogModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatProgressBarModule,
  MatExpansionModule,
  MatSortModule,
  MatTableModule,
  MatDividerModule,
  ClipboardModule,
  NgReduxFormModule,
  MatButtonToggleModule,
  MatTabsModule,
  MatOptionModule,
  MatFormFieldModule,
  MatPaginatorModule,
];

@NgModule({
  imports: [
    ...modules,
  ],
  declarations: [
    AddProjectDialogComponent,
    AddSshKeyDialogComponent,
    ConfirmationDialogComponent,
    DialogTitleComponent,
    PropertyComponent,
    EventListComponent,
    LabelFormComponent,
    LabelsComponent,
    TaintFormComponent,
    TaintsComponent,
  ],
  exports: [
    ...modules,
    AddProjectDialogComponent,
    AddSshKeyDialogComponent,
    ConfirmationDialogComponent,
    DialogTitleComponent,
    PropertyComponent,
    EventListComponent,
    LabelFormComponent,
    LabelsComponent,
    TaintFormComponent,
    TaintsComponent,
  ],
  entryComponents: [
    AddProjectDialogComponent,
    AddSshKeyDialogComponent,
    ConfirmationDialogComponent,
  ],
})

export class SharedModule {
}
