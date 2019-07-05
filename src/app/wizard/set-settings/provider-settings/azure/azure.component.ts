import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-azure-cluster-settings',
  templateUrl: './azure.component.html',
})
export class AzureClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;
  hideOptional = true;

  private _formHelper: FormHelper;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
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

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(
        this.form.controls.clientID,
        this.form.controls.clientSecret,
        this.form.controls.subscriptionID,
        this.form.controls.tenantID,
    );

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                            this._wizard.onCustomPresetsDisable.emit(true);

      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  private _clusterProviderSettingsForm(valid: boolean) {
    return {
      cloudSpec: {
        azure: {
          clientID: this.form.controls.clientID.value,
          clientSecret: this.form.controls.clientSecret.value,
          resourceGroup: this.form.controls.resourceGroup.value,
          routeTable: this.form.controls.routeTable.value,
          securityGroup: this.form.controls.securityGroup.value,
          subnet: this.form.controls.subnet.value,
          subscriptionID: this.form.controls.subscriptionID.value,
          tenantID: this.form.controls.tenantID.value,
          vnet: this.form.controls.vnet.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
