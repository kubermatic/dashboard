import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-gcp-cluster-settings',
  templateUrl: './gcp.component.html',
})
export class GCPClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  gcpSettingsForm: FormGroup;
  private gcpSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.gcpSettingsForm = new FormGroup({
      serviceAccount: new FormControl(this.cluster.spec.cloud.gcp.serviceAccount, [Validators.required]),
      firewallRuleName: new FormControl(this.cluster.spec.cloud.gcp.firewallRuleName, [Validators.required]),
      network: new FormControl(this.cluster.spec.cloud.gcp.network, [Validators.required]),
      subnetwork: new FormControl(this.cluster.spec.cloud.gcp.subnetwork, [Validators.required]),
    });

    this.gcpSettingsFormSub = this.gcpSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe((data) => {
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
  }

  ngOnDestroy(): void {
    this.gcpSettingsFormSub.unsubscribe();
  }
}
