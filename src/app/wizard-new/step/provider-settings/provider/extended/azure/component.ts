import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {AzureCloudSpec} from '../../../../../../shared/entity/cloud/AzureCloudSpec';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

enum Controls {
  ResourceGroup = 'resourceGroup',
  RouteTable = 'routeTable',
  SecurityGroup = 'securityGroup',
  Subnet = 'subnet',
  VNet = 'vnet',
}

@Component({
  selector: 'km-wizard-azure-provider-extended',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AzureProviderExtendedComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AzureProviderExtendedComponent), multi: true}
  ]
})
export class AzureProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('Azure Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ResourceGroup]: this._builder.control(''),
      [Controls.RouteTable]: this._builder.control(''),
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.Subnet]: this._builder.control(''),
      [Controls.VNet]: this._builder.control(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value));
    });

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.form.reset());

    merge(
        this.form.get(Controls.ResourceGroup).valueChanges,
        this.form.get(Controls.RouteTable).valueChanges,
        this.form.get(Controls.SecurityGroup).valueChanges,
        this.form.get(Controls.Subnet).valueChanges,
        this.form.get(Controls.VNet).valueChanges,
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._clusterService.cluster = this._getClusterEntity());
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
          azure: {
            resourceGroup: this.form.get(Controls.ResourceGroup).value,
            routeTable: this.form.get(Controls.RouteTable).value,
            securityGroup: this.form.get(Controls.SecurityGroup).value,
            subnet: this.form.get(Controls.Subnet).value,
            vnet: this.form.get(Controls.VNet).value,
          } as AzureCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
