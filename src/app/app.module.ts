import { ApiService } from 'app/api/api.service';
import { StoreModule } from '@ngrx/store';
import { NgModule } from '@angular/core';
import {BrowserModule} from "@angular/platform-browser";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import 'hammerjs';
import {FlexLayoutModule} from "@angular/flex-layout";
import {KubermaticComponent} from "./kubermatic.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {AddSshKeyComponent} from "./sshkey/add-ssh-key/add-ssh-key.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {ClusterItemComponent} from "./cluster-list/cluster-item/cluster-item.component";
import {NodeComponent} from "./cluster/node/node.component";
import {NodeDeleteConfirmationComponent} from "./cluster/node-delete-confirmation/node-delete-confirmation.component";
import {NodeDeleteConfirmationService} from "./cluster/node-delete-confirmation/node-delete-confirmation.service";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {SshkeyComponent} from "./sshkey/sshkey.component";
import {NotificationComponent} from "./notification/notification.component";
import {AppRoutingModule} from "./app.routing";
import {CustomFormsModule} from "ng2-validation";
import {combinedReducer} from "./reducers/index";
import {SimpleNotificationsModule} from "angular2-notifications";
import {ClusterDeleteConfirmationComponent} from "./cluster/cluster-delete-confirmation/cluster-delete-confirmation.component";
import {ListSshKeyComponent} from './sshkey/list-ssh-key/list-ssh-key.component';
import { AddSshKeyModalComponent } from './wizard/add-ssh-key-modal/add-ssh-key-modal.component';
import { ClusterHealthStatusComponent } from './cluster-health-status/cluster-health-status.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { SshKeyFormFieldComponent } from './wizard/ssh-key-form-field/ssh-key-form-field.component';
import {AWSAddNodeFormComponent} from "./forms/add-node/aws/aws-add-node.component";
import {DigitaloceanAddNodeComponent} from "./forms/add-node/digitalocean/digitalocean-add-node.component";
import {OpenstackAddNodeComponent} from "./forms/add-node/openstack/openstack-add-node.component";
import { ClipboardModule } from 'ngx-clipboard';
import { ProgressComponent } from './wizard/progress/progress.component';
import { NavigationButtonsComponent } from './wizard/navigation-buttons/navigation-buttons.component';
import { SetProviderComponent } from './wizard/set-provider/set-provider.component';
import { SetDatacenterComponent } from './wizard/set-datacenter/set-datacenter.component';
import { SetClusterNameComponent } from './wizard/set-cluster-name/set-cluster-name.component';
import { UpgradeClusterComponent } from './cluster/upgrade-cluster/upgrade-cluster.component';
import { SummaryComponent } from './wizard/summary/summary.component';
import { ProviderClusterComponent } from './provider/cluster/cluster.component'
import { ProviderNodeComponent } from './provider/node/node.component'
import { DigitaloceanClusterComponent } from './provider/cluster/digitalocean/digitalocean.component';
import { AWSClusterComponent } from './provider/cluster/aws/aws.component';
import { OpenstackClusterComponent } from './provider/cluster/openstack/openstack.component';
import { AwsNodeComponent } from './provider/node/aws/aws.component';
import { DigitaloceanNodeComponent } from './provider/node/digitalocean/digitalocean.component';
import { OpenstackNodeComponent } from './provider/node/openstack/openstack.component';
import { MobileNavigationComponent } from './overlays';
import { SetSettingsComponent } from './wizard/set-settings/set-settings.component';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from 'app/core/core.module';

@NgModule({
  imports: [
    CoreModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    AppRoutingModule,
    CustomFormsModule,
    StoreModule.provideStore(combinedReducer),
    SimpleNotificationsModule.forRoot(),
    FlexLayoutModule,
    ClipboardModule
  ],
  declarations: [
    KubermaticComponent,
    FrontpageComponent,
    DashboardComponent,
    WizardComponent,
    ClusterComponent,
    ClusterListComponent,
    ClusterItemComponent,
    NodeComponent,
    SshkeyComponent,
    NotificationComponent,
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    AddSshKeyComponent,
    ListSshKeyComponent,
    AddSshKeyModalComponent,
    ClusterHealthStatusComponent,
    PageNotFoundComponent,
    SshKeyFormFieldComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    ProgressComponent,
    NavigationButtonsComponent,
    SetProviderComponent,
    SetDatacenterComponent,
    SetClusterNameComponent,
    UpgradeClusterComponent,
    SummaryComponent,
    ProviderClusterComponent,
    ProviderNodeComponent,
    DigitaloceanClusterComponent,
    AWSClusterComponent,
    OpenstackClusterComponent,
    AwsNodeComponent,
    DigitaloceanNodeComponent,
    OpenstackNodeComponent,
    MobileNavigationComponent,
    SetSettingsComponent
  ],
  entryComponents: [
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    AddSshKeyModalComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    UpgradeClusterComponent,
    MobileNavigationComponent
  ],
  providers: [
    ApiService,
    NodeDeleteConfirmationService
  ],
  bootstrap: [KubermaticComponent]
})

export class AppModule { }
