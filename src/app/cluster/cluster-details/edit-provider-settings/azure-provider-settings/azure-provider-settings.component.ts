import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services';
import { ClusterService } from '../../../../core/services/cluster/cluster.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { ClusterProviderSettingsData } from '../../../../shared/model/ClusterSpecChange';

@Component({
  selector: 'kubermatic-azure-provider-settings',
  templateUrl: './azure-provider-settings.component.html',
  styleUrls: ['./azure-provider-settings.component.scss']
})

export class AzureProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public azureProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.azureProviderSettingsForm = new FormGroup({
      clientID: new FormControl(this.cluster.spec.cloud.azure.clientID, [Validators.required]),
      clientSecret: new FormControl(this.cluster.spec.cloud.azure.clientSecret, [Validators.required]),
      resourceGroup: new FormControl(this.cluster.spec.cloud.azure.resourceGroup),
      routeTable: new FormControl(this.cluster.spec.cloud.azure.routeTable),
      securityGroup: new FormControl(this.cluster.spec.cloud.azure.securityGroup),
      subnet: new FormControl(this.cluster.spec.cloud.azure.subnet),
      subscriptionID: new FormControl(this.cluster.spec.cloud.azure.subscriptionID),
      tenantID: new FormControl(this.cluster.spec.cloud.azure.tenantID),
      vnet: new FormControl(this.cluster.spec.cloud.azure.vnet),
    });

    this.subscriptions.push(this.azureProviderSettingsForm.valueChanges.subscribe(data => {
      if (this.azureProviderSettingsForm.valid) {
        this.clusterService.changeProviderSettingsData(this.getProviderSettingsData());
      }
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsData(): ClusterProviderSettingsData {
    return {
      azure: {
        clientID: this.azureProviderSettingsForm.controls.clientID.value,
        clientSecret: this.azureProviderSettingsForm.controls.clientSecret.value,
        resourceGroup: this.azureProviderSettingsForm.controls.resourceGroup.value,
        routeTable: this.azureProviderSettingsForm.controls.routeTable.value,
        securityGroup: this.azureProviderSettingsForm.controls.securityGroup.value,
        subnet: this.azureProviderSettingsForm.controls.subnet.value,
        subscriptionID: this.azureProviderSettingsForm.controls.subscriptionID.value,
        tenantID: this.azureProviderSettingsForm.controls.tenantID.value,
        vnet: this.azureProviderSettingsForm.controls.vnet.value,
      },
      valid: true
    };
  }
}
