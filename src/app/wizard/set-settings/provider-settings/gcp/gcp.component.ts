import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-gcp-cluster-settings',
  templateUrl: './gcp.component.html',
})
export class GCPClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  gcpSettingsForm: FormGroup;
  hideOptional = true;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.gcpSettingsForm = new FormGroup({
      serviceAccount: new FormControl(this.cluster.spec.cloud.gcp.serviceAccount, [Validators.required]),
      firewallRuleName: new FormControl(this.cluster.spec.cloud.gcp.firewallRuleName),
      network: new FormControl(this.cluster.spec.cloud.gcp.network),
      subnetwork: new FormControl(this.cluster.spec.cloud.gcp.subnetwork),
    });

    this.gcpSettingsForm.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          gcp: {
            serviceAccount: this.gcpSettingsForm.controls.serviceAccount.value,
            firewallRuleName: this.gcpSettingsForm.controls.firewallRuleName.value,
            network: this.gcpSettingsForm.controls.network.value,
            subnetwork: this.gcpSettingsForm.controls.subnetwork.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.gcpSettingsForm.valid,
      });
    });

    this.wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
