import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {PresetsService} from '../../../../../../core/services';
import {AzureCloudSpec, CloudSpec, Cluster, ClusterSpec} from '../../../../../../shared/entity/cluster';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

export enum Controls {
  ClientID = 'clientID',
  ClientSecret = 'clientSecret',
  TenantID = 'tenantID',
  SubscriptionID = 'subscriptionID',
}

@Component({
  selector: 'km-wizard-azure-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AzureProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AzureProviderBasicComponent),
      multi: true,
    },
  ],
})
export class AzureProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService
  ) {
    super('Azure Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ClientID]: this._builder.control('', Validators.required),
      [Controls.ClientSecret]: this._builder.control('', Validators.required),
      [Controls.TenantID]: this._builder.control('', Validators.required),
      [Controls.SubscriptionID]: this._builder.control('', Validators.required),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._presets.enablePresets(
          Object.values(this._clusterService.cluster.spec.cloud.azure).every(value => !value)
        );
      });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    merge(
      this.form.get(Controls.ClientSecret).valueChanges,
      this.form.get(Controls.ClientID).valueChanges,
      this.form.get(Controls.TenantID).valueChanges,
      this.form.get(Controls.SubscriptionID).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterService.cluster = this._getClusterEntity()));
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
          azure: {
            clientID: this.form.get(Controls.ClientID).value,
            clientSecret: this.form.get(Controls.ClientSecret).value,
            tenantID: this.form.get(Controls.TenantID).value,
            subscriptionID: this.form.get(Controls.SubscriptionID).value,
          } as AzureCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
