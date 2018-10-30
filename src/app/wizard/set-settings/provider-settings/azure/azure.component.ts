import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-azure-cluster-settings',
  templateUrl: './azure.component.html',
  styleUrls: ['./azure.component.scss']
})
export class AzureClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public azureSettingsForm: FormGroup;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService) { }

  ngOnInit(): void {
    this.azureSettingsForm = new FormGroup({
      clientID: new FormControl(this.cluster.spec.cloud.azure.clientID, [Validators.required]),
      clientSecret: new FormControl(this.cluster.spec.cloud.azure.clientSecret, [Validators.required]),
      subscriptionID: new FormControl(this.cluster.spec.cloud.azure.subscriptionID, [Validators.required]),
      tenantID: new FormControl(this.cluster.spec.cloud.azure.tenantID, [Validators.required]),
      resourceGroup: new FormControl(this.cluster.spec.cloud.azure.resourceGroup),
      routeTable: new FormControl(this.cluster.spec.cloud.azure.routeTable),
      securityGroup: new FormControl(this.cluster.spec.cloud.azure.securityGroup),
      subnet: new FormControl(this.cluster.spec.cloud.azure.subnet),
      vnet: new FormControl(this.cluster.spec.cloud.azure.vnet),
    });

    this.subscriptions.push(this.azureSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          azure: {
            clientID: this.azureSettingsForm.controls.clientID.value,
            clientSecret: this.azureSettingsForm.controls.clientSecret.value,
            resourceGroup: this.azureSettingsForm.controls.resourceGroup.value,
            routeTable: this.azureSettingsForm.controls.routeTable.value,
            securityGroup: this.azureSettingsForm.controls.securityGroup.value,
            subnet: this.azureSettingsForm.controls.subnet.value,
            subscriptionID: this.azureSettingsForm.controls.subscriptionID.value,
            tenantID: this.azureSettingsForm.controls.tenantID.value,
            vnet: this.azureSettingsForm.controls.vnet.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.azureSettingsForm.valid,
      });
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe(data => {
      this.hideOptional = data.hideOptional;
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
