import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ClipboardModule} from 'ngx-clipboard';
import {CustomFormsModule} from 'ngx-custom-validators';

import {NotificationComponent} from '../core/components/notification/notification.component';
import {TokenDialogComponent} from '../serviceaccount/serviceaccount-token/token-dialog/token-dialog.component';

import {AddProjectDialogComponent} from './components/add-project-dialog/add-project-dialog.component';
import {AddSshKeyDialogComponent} from './components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {AddonsListComponent} from './components/addon-list/addon-list.component';
import {EditAddonDialogComponent} from './components/addon-list/edit-addon-dialog/edit-addon-dialog.component';
import {InstallAddonDialogComponent} from './components/addon-list/install-addon-dialog/install-addon-dialog.component';
import {SelectAddonDialogComponent} from './components/addon-list/select-addon-dialog/select-addon-dialog.component';
import {ConfirmationDialogComponent} from './components/confirmation-dialog/confirmation-dialog.component';
import {DialogTitleComponent} from './components/dialog-title/dialog-title.component';
import {EventListComponent} from './components/event-list/event-list.component';
import {LabelFormComponent} from './components/label-form/label-form.component';
import {LabelsComponent} from './components/labels/labels.component';
import {PropertyBooleanComponent} from './components/property-boolean/property-boolean.component';
import {PropertyUsageComponent} from './components/property-usage/property-usage.component';
import {PropertyComponent} from './components/property/property.component';
import {RelativeTimeComponent} from './components/relativetime/relative-time.component';
import {SettingsStatusComponent} from './components/settings-status/settings-status.component';
import {ShortNameInCircleComponent} from './components/short-name-in-circle/short-name-in-circle.component';
import {SSHKeyListComponent} from './components/ssh-key-list/ssh-key-list.component';
import {TagListComponent} from './components/tag-list/tag-list.component';
import {TaintFormComponent} from './components/taint-form/taint-form.component';
import {TaintsComponent} from './components/taints/taints.component';
import {RelativeTimePipe} from './pipes/relativetime';

const modules: any[] = [
  CommonModule,          FormsModule,       ReactiveFormsModule,  CustomFormsModule,    FlexLayoutModule,
  MatButtonModule,       MatIconModule,     MatInputModule,       MatListModule,        MatProgressSpinnerModule,
  MatSidenavModule,      MatSnackBarModule, MatToolbarModule,     MatTooltipModule,     MatSelectModule,
  MatAutocompleteModule, MatCheckboxModule, MatMenuModule,        MatChipsModule,       MatCardModule,
  MatDialogModule,       MatSliderModule,   MatSlideToggleModule, MatProgressBarModule, MatExpansionModule,
  MatSortModule,         MatTableModule,    MatDividerModule,     ClipboardModule,      MatButtonToggleModule,
  MatTabsModule,         MatOptionModule,   MatFormFieldModule,   MatPaginatorModule,   MatSnackBarModule,
  MatBadgeModule,
];

const components: any[] = [
  PropertyBooleanComponent,
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
  SettingsStatusComponent,
  ShortNameInCircleComponent,
  TagListComponent,
  TokenDialogComponent,
  NotificationComponent,
  PropertyUsageComponent,
];

const entryComponents: any[] = [
  AddProjectDialogComponent,
  AddSshKeyDialogComponent,
  ConfirmationDialogComponent,
  SelectAddonDialogComponent,
  InstallAddonDialogComponent,
  EditAddonDialogComponent,
  TokenDialogComponent,
  NotificationComponent,
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
