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
import {AddAddonDialogComponent} from './components/addon-list/add-addon-dialog/add-addon-dialog.component';
import {AddonsListComponent} from './components/addon-list/addon-list.component';
import {BooleanPropertyComponent} from './components/boolean-property/boolean-property.component';
import {ConfirmationDialogComponent} from './components/confirmation-dialog/confirmation-dialog.component';
import {DialogTitleComponent} from './components/dialog-title/dialog-title.component';
import {EventListComponent} from './components/event-list/event-list.component';
import {LabelFormComponent} from './components/label-form/label-form.component';
import {LabelsComponent} from './components/labels/labels.component';
import {PropertyComponent} from './components/property/property.component';
import {RelativeTimeComponent} from './components/relativetime/relative-time.component';
import {SSHKeyListComponent} from './components/ssh-key-list/ssh-key-list.component';
import {TaintFormComponent} from './components/taint-form/taint-form.component';
import {TaintsComponent} from './components/taints/taints.component';
import {RelativeTimePipe} from './pipes/relativetime';

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

const components: any[] = [
  BooleanPropertyComponent,
  DialogTitleComponent,
  PropertyComponent,
  EventListComponent,
  LabelFormComponent,
  LabelsComponent,
  TaintFormComponent,
  TaintsComponent,
  RelativeTimePipe,
  RelativeTimeComponent,
  SSHKeyListComponent,
  AddonsListComponent,
];

const entryComponents: any[] = [
  AddProjectDialogComponent,
  AddSshKeyDialogComponent,
  ConfirmationDialogComponent,
  AddAddonDialogComponent,
];

@NgModule({
  imports: [
    ...modules,
  ],
  declarations: [
    ...components,
    ...entryComponents,
  ],
  exports: [
    ...modules,
    ...components,
    ...entryComponents,
  ],
  entryComponents: [...entryComponents],
})

export class SharedModule {
}
