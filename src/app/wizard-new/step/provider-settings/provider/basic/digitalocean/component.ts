import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {DigitaloceanCloudSpec} from '../../../../../../shared/entity/cloud/DigitaloceanCloudSpec';
import {CloudSpec, Cluster, ClusterSpec} from '../../../../../../shared/entity/cluster';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

export enum Controls {
  Token = 'token',
}

@Component({
  selector: 'km-wizard-digitalocean-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DigitalOceanProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DigitalOceanProviderBasicComponent),
      multi: true,
    },
  ],
})
export class DigitalOceanProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService
  ) {
    super('DigitalOcean Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Token]: this._builder.control('', Validators.required),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.DIGITALOCEAN))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value))
      );

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form
      .get(Controls.Token)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
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

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          digitalocean: {
            token: this.form.get(Controls.Token).value,
          } as DigitaloceanCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
