import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../../core/services';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-azure-provider-options',
  templateUrl: './azure-provider-options.component.html',
})
export class AzureProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;

  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      resourceGroup: new FormControl(this.cluster.spec.cloud.azure.resourceGroup),
      routeTable: new FormControl(this.cluster.spec.cloud.azure.routeTable),
      securityGroup: new FormControl(this.cluster.spec.cloud.azure.securityGroup),
      subnet: new FormControl(this.cluster.spec.cloud.azure.subnet),
      vnet: new FormControl(this.cluster.spec.cloud.azure.vnet),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm());
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  private _clusterProviderSettingsForm(): ClusterProviderSettingsForm {
    const isValid: boolean = this.cluster.spec.cloud.azure.clientID !== '' &&
        this.cluster.spec.cloud.azure.clientSecret !== '' && this.cluster.spec.cloud.azure.subscriptionID !== '' &&
        this.cluster.spec.cloud.azure.tenantID !== '';

    return {
      cloudSpec: {
        azure: {
          clientID: this.cluster.spec.cloud.azure.clientID,
          clientSecret: this.cluster.spec.cloud.azure.clientSecret,
          subscriptionID: this.cluster.spec.cloud.azure.subscriptionID,
          tenantID: this.cluster.spec.cloud.azure.tenantID,
          resourceGroup: this.form.controls.resourceGroup.value,
          routeTable: this.form.controls.routeTable.value,
          securityGroup: this.form.controls.securityGroup.value,
          subnet: this.form.controls.subnet.value,
          vnet: this.form.controls.vnet.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid: isValid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
