// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
import {MatOptionModule, MatRippleModule} from '@angular/material/core';
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
import {MatStepperModule} from '@angular/material/stepper';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ClipboardModule} from 'ngx-clipboard';
import {CustomFormsModule} from 'ngx-custom-validators';
import {FilterPipeModule} from 'ngx-filter-pipe';

import {NotificationComponent} from '../core/components/notification/component';
import {TokenDialogComponent} from '../serviceaccount/serviceaccount-token/token-dialog/token-dialog.component';

import {AddProjectDialogComponent} from './components/add-project-dialog/add-project-dialog.component';
import {AddSshKeyDialogComponent} from './components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {AddonsListComponent} from './components/addon-list/addon-list.component';
import {EditAddonDialogComponent} from './components/addon-list/edit-addon-dialog/edit-addon-dialog.component';
import {InstallAddonDialogComponent} from './components/addon-list/install-addon-dialog/install-addon-dialog.component';
import {SelectAddonDialogComponent} from './components/addon-list/select-addon-dialog/select-addon-dialog.component';
import {ChipComponent} from './components/chip/component';
import {FilteredComboboxComponent} from './components/combobox/component';
import {OptionDirective} from './components/combobox/directive';
import {ConfirmationDialogComponent} from './components/confirmation-dialog/confirmation-dialog.component';
import {DialogTitleComponent} from './components/dialog-title/dialog-title.component';
import {ClusterTypeEOLComponent} from './components/eol/component';
import {EventListComponent} from './components/event-list/component';
import {LabelFormComponent} from './components/label-form/label-form.component';
import {LabelsComponent} from './components/labels/labels.component';
import {MachineNetworkComponent} from './components/machine-networks-new/component';
import {PropertyBooleanComponent} from './components/property-boolean/property-boolean.component';
import {PropertyUsageComponent} from './components/property-usage/component';
import {PropertyComponent} from './components/property/property.component';
import {RelativeTimeComponent} from './components/relativetime/relative-time.component';
import {SettingsStatusComponent} from './components/settings-status/settings-status.component';
import {InitialsCircleComponent} from './components/initials-circle/initials-circle.component';
import {SSHKeyListComponent} from './components/ssh-key-list/ssh-key-list.component';
import {TagListComponent} from './components/tag-list/tag-list.component';
import {TaintFormComponent} from './components/taint-form/taint-form.component';
import {TaintsComponent} from './components/taints/taints.component';
import {AutofocusDirective} from './directives/autofocus/directive';
import {RelativeTimePipe} from './pipes/relativetime';
import {ClusterService} from './services/cluster.service';
import {EndOfLifeService} from './services/eol.service';
import {EditorComponent} from './components/editor/component';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {ExternalClusterDataDialogComponent} from './components/external-cluster-data-dialog/component';
import {LoaderComponent} from './components/loader/component';
import {SearchFieldComponent} from './components/search-field/component';
import {TabCardComponent} from '@shared/components/tab-card/component';
import {TabComponent} from '@shared/components/tab-card/tab/component';
import {EventCardComponent} from '@shared/components/event-card/component';
import {ScrollingModule} from '@angular/cdk/scrolling';

import {OverlayModule} from '@angular/cdk/overlay';
import {DialogComponent} from './components/guided-tour/dialog/component';
import {DialogService} from './components/guided-tour/dialog/service';
import {GuidedTourDirective} from './components/guided-tour/directive';
import {GTAddProjectBtnComponent} from './components/guided-tour/steps/add-project-btn/component';
import {GTAddProjectDialogComponent} from './components/guided-tour/steps/add-project-dialog/component';
import {GTProjectItemComponent} from './components/guided-tour/steps/project-item/component';
import {DialogHelperService} from './components/guided-tour/dialog/helper.service';

const modules: any[] = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  CustomFormsModule,
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
  MatButtonToggleModule,
  MatTabsModule,
  MatOptionModule,
  MatFormFieldModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatBadgeModule,
  MatStepperModule,
  MatRippleModule,
  ScrollingModule,
  FilterPipeModule,
  MonacoEditorModule,
  OverlayModule,
];

const components: any[] = [
  PropertyBooleanComponent,
  DialogTitleComponent,
  PropertyComponent,
  EventCardComponent,
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
  InitialsCircleComponent,
  TagListComponent,
  TokenDialogComponent,
  NotificationComponent,
  PropertyUsageComponent,
  FilteredComboboxComponent,
  MachineNetworkComponent,
  ClusterTypeEOLComponent,
  ChipComponent,
  EditorComponent,
  AddProjectDialogComponent,
  AddSshKeyDialogComponent,
  ConfirmationDialogComponent,
  SelectAddonDialogComponent,
  InstallAddonDialogComponent,
  EditAddonDialogComponent,
  TokenDialogComponent,
  NotificationComponent,
  ExternalClusterDataDialogComponent,
  LoaderComponent,
  SearchFieldComponent,
  DialogComponent,
  GTAddProjectBtnComponent,
  GTAddProjectDialogComponent,
  GTProjectItemComponent,
  TabCardComponent,
  TabComponent,
];

const services: any[] = [ClusterService, EndOfLifeService, DialogService, DialogHelperService];

const directives: any[] = [AutofocusDirective, OptionDirective, GuidedTourDirective];

@NgModule({
  imports: [...modules],
  declarations: [...components, ...directives],
  exports: [...modules, ...components, ...directives],
  providers: [...services],
})
export class SharedModule {}
