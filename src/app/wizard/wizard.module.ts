import { AwsNodeComponent } from './provider/node/aws/aws.component';
import { DigitaloceanNodeComponent } from './provider/node/digitalocean/digitalocean.component';
import { ProviderNodeComponent } from './provider/node/node.component';
import { OpenstackClusterComponent } from './provider/cluster/openstack/openstack.component';
import { ProviderClusterComponent } from './provider/cluster/cluster.component';
import { SharedModule } from 'app/shared/shared.module';
import { SshKeyFormFieldComponent } from './ssh-key-form-field/ssh-key-form-field.component';
import { NgModule } from '@angular/core';
import { WizardComponent } from 'app/wizard/wizard.component';
import { AddSshKeyModalComponent } from 'app/wizard/add-ssh-key-modal/add-ssh-key-modal.component';
import { NavigationButtonsComponent } from 'app/wizard/navigation-buttons/navigation-buttons.component';
import { ProgressComponent } from 'app/wizard/progress/progress.component';
import { SetClusterNameComponent } from 'app/wizard/set-cluster-name/set-cluster-name.component';
import { SetDatacenterComponent } from 'app/wizard/set-datacenter/set-datacenter.component';
import { SetProviderComponent } from 'app/wizard/set-provider/set-provider.component';
import { SetSettingsComponent } from 'app/wizard/set-settings/set-settings.component';
import { SummaryComponent } from 'app/wizard/summary/summary.component';
import { DigitaloceanClusterComponent } from './provider/cluster/digitalocean/digitalocean.component';
import { AWSClusterComponent } from './provider/cluster/aws/aws.component';
import { OpenstackNodeComponent } from './provider/node/openstack/openstack.component';
import { WizardRoutingModule } from 'app/wizard/wizard-routing.module';

const components: any[] = [
    WizardComponent,
    AddSshKeyModalComponent,
    NavigationButtonsComponent,
    ProgressComponent,
    SetClusterNameComponent,
    SetDatacenterComponent,
    SetProviderComponent,
    SetSettingsComponent,
    SshKeyFormFieldComponent,
    SummaryComponent,
    ProviderClusterComponent,
    OpenstackClusterComponent,
    DigitaloceanClusterComponent,
    AWSClusterComponent,
    ProviderNodeComponent,
    OpenstackNodeComponent,
    DigitaloceanNodeComponent,
    AwsNodeComponent
];

@NgModule({
    imports: [
        SharedModule,
        WizardRoutingModule
    ],
    declarations: [
        ...components
    ],
    exports: [
        ...components
    ],
    entryComponents: [
        AddSshKeyModalComponent
    ],
    providers: [],
})
export class WizardModule { }
