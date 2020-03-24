import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';
import {WizardService} from '../../../../../service/wizard';
import {AVAILABLE_PACKET_BILLING_CYCLES, PacketCloudSpec} from "../../../../../../shared/entity/cloud/PacketCloudSpec";

export enum Controls {
  APIKey = 'apiKey',
  ProjectID = 'projectID',
  BillingCycle = 'billingCycle',
}

@Component({
  selector: 'km-wizard-packet-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PacketProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => PacketProviderBasicComponent), multi: true}
  ]
})
export class PacketProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly controls = Controls;

  private readonly _debounceTime = 250;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _wizard: WizardService, private readonly _clusterService: ClusterService) {
    super('Packet Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.APIKey]: this._builder.control('',[
        Validators.required,
        Validators.maxLength(256),
      ]),
      [Controls.ProjectID]: this._builder.control('', [
        Validators.required,
        Validators.maxLength(256),
      ]),
      [Controls.BillingCycle]: this._builder.control(this.getAvailableBillingCycles()[0], [
        Validators.required,
        Validators.maxLength(64)
      ]),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value)));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(
      this.form.get(Controls.APIKey).valueChanges,
      this.form.get(Controls.ProjectID).valueChanges,
      this.form.get(Controls.BillingCycle).valueChanges,
    ).pipe(debounceTime(this._debounceTime))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._clusterService.cluster = this._getClusterEntity());

    merge(this._wizard.providerChanges, this._wizard.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.form.reset());
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_PACKET_BILLING_CYCLES;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getClusterEntity(): ClusterEntity {
    return {
      spec: {
        cloud: {
          packet: {
            apiKey: this.form.get(Controls.APIKey).value,
            projectID: this.form.get(Controls.ProjectID).value,
            billingCycle: this.form.get(Controls.BillingCycle).value,
          } as PacketCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as ClusterEntity;
  }
}


