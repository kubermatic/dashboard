import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {AVAILABLE_PACKET_BILLING_CYCLES} from '../../../../shared/entity/cloud/PacketCloudSpec';
import {Cluster} from '../../../../shared/entity/cluster';

@Component({
  selector: 'km-packet-provider-settings',
  templateUrl: './packet-provider-settings.component.html',
})
export class PacketProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  form: FormGroup;
  private _formData = {apiKey: '', projectID: '', billingCycle: ''};
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    let billingCycle = this.cluster.spec.cloud.packet.billingCycle;
    if (!billingCycle) {
      billingCycle = this.getAvailableBillingCycles()[0];
    }

    this._formData.billingCycle = billingCycle;

    this.form = new FormGroup({
      apiKey: new FormControl(''),
      projectID: new FormControl(''),
      billingCycle: new FormControl(billingCycle, [Validators.maxLength(64)]),
    });

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          data.apiKey !== this._formData.apiKey ||
          data.projectID !== this._formData.projectID ||
          data.billingCycle !== this._formData.billingCycle
        ) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  get apiKey(): AbstractControl {
    return this.form.controls.apiKey;
  }

  get projectID(): AbstractControl {
    return this.form.controls.projectID;
  }

  setValidators(): void {
    if (!this.apiKey.value && !this.projectID.value) {
      this.apiKey.clearValidators();
      this.projectID.clearValidators();
    } else {
      this.apiKey.setValidators([Validators.required, Validators.maxLength(256)]);
      this.projectID.setValidators([Validators.required, Validators.maxLength(256)]);
    }

    this.apiKey.updateValueAndValidity();
    this.projectID.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.apiKey.value && !this.projectID.value ? '' : '*';
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
          apiKey: this.form.controls.apiKey.value,
          projectID: this.form.controls.projectID.value,
          billingCycle: this.form.controls.billingCycle.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
