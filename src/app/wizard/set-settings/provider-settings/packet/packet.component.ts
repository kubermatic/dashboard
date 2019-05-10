import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-packet-cluster-settings',
  templateUrl: './packet.component.html',
})
export class PacketClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  packetSettingsForm: FormGroup;
  private packetSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.packetSettingsForm = new FormGroup({
      apiKey: new FormControl(this.cluster.spec.cloud.packet.apiKey, [Validators.required, Validators.maxLength(256)]),
      projectID:
          new FormControl(this.cluster.spec.cloud.packet.projectID, [Validators.required, Validators.maxLength(256)]),
      billingCycle: new FormControl(this.cluster.spec.cloud.packet.billingCycle, [Validators.maxLength(64)]),
    });

    this.packetSettingsFormSub = this.packetSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe(() => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          packet: {
            apiKey: this.packetSettingsForm.controls.apiKey.value,
            projectID: this.packetSettingsForm.controls.projectID.value,
            billingCycle: this.packetSettingsForm.controls.billingCycle.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.packetSettingsForm.valid,
      });
    });
  }

  ngOnDestroy(): void {
    this.packetSettingsFormSub.unsubscribe();
  }
}
