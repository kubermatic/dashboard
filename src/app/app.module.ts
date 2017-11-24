import { ClusterModule } from './cluster/cluster.module';
import { PagesModule } from './pages/pages.module';
import { StoreModule } from '@ngrx/store';
import { NgModule } from '@angular/core';
import { BrowserModule } from "@angular/platform-browser";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { KubermaticComponent } from "./kubermatic.component";
import { WizardComponent } from "./wizard/wizard.component";
import { AddSshKeyComponent } from "./sshkey/add-ssh-key/add-ssh-key.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { SshkeyComponent } from "./sshkey/sshkey.component";
import { AppRoutingModule } from "./app-routing.module";
import { combinedReducer } from "./redux/reducers/index";
import { ListSshKeyComponent } from './sshkey/list-ssh-key/list-ssh-key.component';
import { AddSshKeyModalComponent } from './wizard/add-ssh-key-modal/add-ssh-key-modal.component';
import { SshKeyFormFieldComponent } from './wizard/ssh-key-form-field/ssh-key-form-field.component';
import { AWSAddNodeFormComponent } from "./forms/add-node/aws/aws-add-node.component";
import { DigitaloceanAddNodeComponent } from "./forms/add-node/digitalocean/digitalocean-add-node.component";
import { OpenstackAddNodeComponent } from "./forms/add-node/openstack/openstack-add-node.component";
import { ProgressComponent } from './wizard/progress/progress.component';
import { NavigationButtonsComponent } from './wizard/navigation-buttons/navigation-buttons.component';
import { SetProviderComponent } from './wizard/set-provider/set-provider.component';
import { SetDatacenterComponent } from './wizard/set-datacenter/set-datacenter.component';
import { SetClusterNameComponent } from './wizard/set-cluster-name/set-cluster-name.component';
import { SummaryComponent } from './wizard/summary/summary.component';
import { ProviderClusterComponent } from './provider/cluster/cluster.component';
import { ProviderNodeComponent } from './provider/node/node.component';
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
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    PagesModule,
    StoreModule.provideStore(combinedReducer),
    ClusterModule
  ],
  declarations: [
    KubermaticComponent,
    DashboardComponent,
    WizardComponent,
    SshkeyComponent,
    AddSshKeyComponent,
    ListSshKeyComponent,
    AddSshKeyModalComponent,
    SshKeyFormFieldComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    ProgressComponent,
    NavigationButtonsComponent,
    SetProviderComponent,
    SetDatacenterComponent,
    SetClusterNameComponent,
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
    AddSshKeyModalComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    MobileNavigationComponent
  ],
  providers: [],
  bootstrap: [KubermaticComponent]
})

export class AppModule { }
