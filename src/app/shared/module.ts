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

import {ScrollingModule} from '@angular/cdk/scrolling';
import {CommonModule, DecimalPipe} from '@angular/common';
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
import {MatRadioModule} from '@angular/material/radio';
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
import {NotificationComponent} from '@core/components/notification/component';
import {AutocompleteComponent} from '@shared/components/autocomplete/component';
import {CIDRFormComponent} from '@shared/components/cidr-form/component';
import {ClusterFromTemplateDialogComponent} from '@shared/components/cluster-from-template/component';
import {ClusterSummaryComponent} from '@shared/components/cluster-summary/component';
import {EventCardComponent} from '@shared/components/event-card/component';
import {SaveClusterTemplateDialogComponent} from '@shared/components/save-cluster-template/component';
import {SelectClusterTemplateDialogComponent} from '@shared/components/select-cluster-template/component';
import {TabCardComponent} from '@shared/components/tab-card/component';
import {DynamicTabComponent} from '@shared/components/tab-card/dynamic-tab/component';
import {TabComponent} from '@shared/components/tab-card/tab/component';
import {LinkLocationPipe} from '@shared/pipes/linklocation';
import {SizeFormatterPipe} from '@shared/pipes/size';
import {ClipboardModule} from 'ngx-clipboard';
import {FilterPipeModule} from 'ngx-filter-pipe';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {AddProjectDialogComponent} from './components/add-project-dialog/component';
import {AddSshKeyDialogComponent} from './components/add-ssh-key-dialog/component';
import {AddonsListComponent} from './components/addon-list/component';
import {EditAddonDialogComponent} from './components/addon-list/edit-addon-dialog/component';
import {InstallAddonDialogComponent} from './components/addon-list/install-addon-dialog/component';
import {ChipComponent} from './components/chip/component';
import {FilteredComboboxComponent} from './components/combobox/component';
import {OptionDirective} from './components/combobox/directive';
import {ConfirmationDialogComponent} from './components/confirmation-dialog/component';
import {DialogTitleComponent} from './components/dialog-title/component';
import {EditorComponent} from './components/editor/component';
import {ClusterTypeEOLComponent} from './components/eol/component';
import {EventListComponent} from './components/event-list/component';
import {ExternalClusterDataDialogComponent} from './components/external-cluster-data-dialog/component';
import {InitialsCircleComponent} from './components/initials-circle/component';
import {LabelFormComponent} from './components/label-form/component';
import {LabelsComponent} from './components/labels/component';
import {LoaderComponent} from './components/loader/component';
import {MachineNetworkComponent} from './components/machine-networks-new/component';
import {PropertyBooleanComponent} from './components/property-boolean/component';
import {PropertyUsageComponent} from './components/property-usage/component';
import {PropertyComponent} from './components/property/component';
import {RelativeTimeComponent} from './components/relativetime/component';
import {SearchFieldComponent} from './components/search-field/component';
import {SpinnerWithConfirmationComponent} from './components/spinner-with-confirmation/component';
import {SSHKeyListComponent} from './components/ssh-key-list/component';
import {TagListComponent} from './components/tag-list/component';
import {TaintFormComponent} from './components/taint-form/component';
import {TaintsComponent} from './components/taints/component';
import {AutofocusDirective} from './directives/autofocus/directive';
import {RelativeTimePipe} from './pipes/relativetime';

const modules: any[] = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
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
  MatRadioModule,
  ScrollingModule,
  FilterPipeModule,
  MonacoEditorModule,
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
  CIDRFormComponent,
  RelativeTimePipe,
  RelativeTimeComponent,
  SSHKeyListComponent,
  AddonsListComponent,
  SpinnerWithConfirmationComponent,
  InitialsCircleComponent,
  TagListComponent,
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
  InstallAddonDialogComponent,
  EditAddonDialogComponent,
  ExternalClusterDataDialogComponent,
  LoaderComponent,
  SearchFieldComponent,
  TabCardComponent,
  TabComponent,
  DynamicTabComponent,
  AutocompleteComponent,
  LinkLocationPipe,
  ClusterSummaryComponent,
  ClusterFromTemplateDialogComponent,
  SaveClusterTemplateDialogComponent,
  SelectClusterTemplateDialogComponent,
  SizeFormatterPipe,
];

const directives: any[] = [AutofocusDirective, OptionDirective];

@NgModule({
  imports: [...modules],
  declarations: [...components, ...directives],
  providers: [DecimalPipe],
  exports: [...modules, ...components, ...directives],
})
export class SharedModule {}
