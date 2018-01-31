import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';

@Component({
    selector: 'kubermatic-navigation-buttons',
    template: '',
})
export class NavigationButtonsStubComponent { }

@Component({
    selector: 'kubermatic-progress',
    template: '',
})
export class ProgressStubComponent { }

@Component({
    selector: 'kubermatic-summary',
    template: '',
})
export class SummaryStubComponent { }

@Component({
    selector: 'kubermatic-provider-cluster',
    template: '',
})
export class ProviderClusterStubComponent { }

@Component({
    selector: 'kubermatic-provider-node',
    template: '',
})
export class ProviderNodeStubComponent { }

@Component({
    selector: 'kubermatic-ssh-key-form-field',
    template: '',
})
export class SshKeyFormFieldStubComponent { }

@Component({
    selector: 'kubermatic-cluster-openstack',
    template: '',
})
export class OpenstackClusterStubComponent { }

@Component({
    selector: 'kubermatic-cluster-digitalocean',
    template: '',
})
export class DigitaloceanClusterStubComponent { }

@Component({
    selector: 'kubermatic-cluster-bringyourown',
    template: '',
})
export class BringyourownClusterStubComponent { }

@Component({
    selector: 'kubermatic-cluster-aws',
    template: '',
})
export class AWSClusterStubComponent { }

@Component({
    selector: 'kubermatic-set-cluster-name',
    template: '',
})
export class SetClusterNameStubComponent { }

@Component({
    selector: 'kubermatic-set-provider',
    template: '',
})
export class SetProviderStubComponent { }

@Component({
    selector: 'kubermatic-set-datacenter',
    template: '',
})
export class SetDatacenterStubComponent { }

@Component({
    selector: 'kubermatic-set-settings',
    template: '',
})
export class SetSettingsStubComponent { }

const components: any[] = [
    NavigationButtonsStubComponent,
    ProgressStubComponent,
    SummaryStubComponent,
    ProviderClusterStubComponent,
    ProviderNodeStubComponent,
    SshKeyFormFieldStubComponent,
    OpenstackClusterStubComponent,
    DigitaloceanClusterStubComponent,
    BringyourownClusterStubComponent,
    AWSClusterStubComponent,
    SetClusterNameStubComponent,
    SetProviderStubComponent,
    SetDatacenterStubComponent,
    SetSettingsStubComponent
];

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ...components
    ],
    exports: [
        ...components
    ]
})
export class WizardStubsModule { }
