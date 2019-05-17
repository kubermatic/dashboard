import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {AVAILABLE_PACKET_BILLING_CYCLES} from '../../../../shared/entity/cloud/PacketCloudSpec';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-packet-provider-settings',
  templateUrl: './packet-provider-settings.component.html',
})

export class PacketProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  packetProviderSettingsForm: FormGroup;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    const billingCycle = !!this.cluster.spec.cloud.packet.billingCycle ? this.cluster.spec.cloud.packet.billingCycle :
                                                                         this.getAvailableBillingCycles()[0];

    this.packetProviderSettingsForm = new FormGroup({
      apiKey: new FormControl(
          this.cluster.spec.cloud.packet.apiKey,
          [
            Validators.required,
            Validators.maxLength(256),
          ]),
      projectID: new FormControl(
          this.cluster.spec.cloud.packet.projectID,
          [
            Validators.required,
            Validators.maxLength(256),
          ]),
      billingCycle: new FormControl(
          billingCycle,
          [
            Validators.maxLength(64),
          ]),
    });

    this.packetProviderSettingsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_PACKET_BILLING_CYCLES;
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        packet: {
          apiKey: this.packetProviderSettingsForm.controls.apiKey.value,
          projectID: this.packetProviderSettingsForm.controls.projectID.value,
          billingCycle: this.packetProviderSettingsForm.controls.billingCycle.value,
        },
      },
      isValid: this.packetProviderSettingsForm.valid,
    };
  }
}
