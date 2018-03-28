import { ProviderNodeComponent } from './set-settings/provider/node/node.component';
import { OpenstackClusterComponent } from './set-settings/provider/cluster/openstack/openstack.component';
import { ProviderClusterComponent } from './set-settings/provider/cluster/cluster.component';
import { SharedModule } from 'app/shared/shared.module';
import { SshKeyFormFieldComponent } from './set-settings/ssh-key-form-field/ssh-key-form-field.component';
import { NgModule } from '@angular/core';
import { WizardComponent } from 'app/wizard/wizard.component';
import { NavigationButtonsComponent } from 'app/wizard/navigation-buttons/navigation-buttons.component';
import { ProgressComponent } from 'app/wizard/progress/progress.component';
import { SetClusterNameComponent } from 'app/wizard/set-cluster-name/set-cluster-name.component';
import { SetDatacenterComponent } from 'app/wizard/set-datacenter/set-datacenter.component';
import { SetProviderComponent } from 'app/wizard/set-provider/set-provider.component';
import { SetSettingsComponent } from 'app/wizard/set-settings/set-settings.component';
import { SummaryComponent } from 'app/wizard/summary/summary.component';
import { DigitaloceanClusterComponent } from './set-settings/provider/cluster/digitalocean/digitalocean.component';
import { AWSClusterComponent } from './set-settings/provider/cluster/aws/aws.component';
import { WizardRoutingModule } from 'app/wizard/wizard-routing.module';
import { AddNodeModule } from 'app/add-node/add-node.module';
import { BringyourownClusterComponent } from 'app/wizard/set-settings/provider/cluster/bringyourown/bringyourown.component';

const components: any[] = [
  WizardComponent,
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
  BringyourownClusterComponent
];

@NgModule({
  imports: [
    SharedModule,
    WizardRoutingModule,
    AddNodeModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ],
  entryComponents: [],
  providers: [],
})
export class WizardModule {
}
