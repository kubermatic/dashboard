// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {GlobalModule} from '@core/services/global/module';
import {NodeDataService} from '@core/services/node-data/service';
import {DynamicModule} from '@app/dynamic/module-registry';
import {Observable} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {DigitaloceanSizes, Optimized, Standard} from '@shared/entity/provider/digitalocean';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';

enum Controls {
  Size = 'size',
}

enum SizeTypes {
  Optimized = 'Optimized Droplets',
  Standard = 'Standard Droplets',
}

enum SizeState {
  Ready = 'Node Size',
  Loading = 'Loading...',
  Empty = 'No Node Sizes Available',
}

@Component({
    selector: 'km-digitalocean-basic-node-data',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DigitalOceanBasicNodeDataComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DigitalOceanBasicNodeDataComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DigitalOceanBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  private _quotaCalculationService: QuotaCalculationService;
  private _sizes: DigitaloceanSizes = DigitaloceanSizes.newDigitalOceanSizes();
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  selectedSize = '';
  sizeLabel = SizeState.Empty;

  get sizeTypes(): string[] {
    return Object.values(SizeTypes);
  }

  private get _sizesObservable(): Observable<DigitaloceanSizes> {
    return this._nodeDataService.digitalOcean.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
    });

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));

    this.form
      .get(Controls.Size)
      .valueChanges.pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const payload = this._getQuotaCalculationPayload();
        if (payload) {
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTypes(group: SizeTypes): Optimized[] | Standard[] {
    const key = Object.keys(SizeTypes).find(key => SizeTypes[key] === group);
    return this._sizes[key.toLowerCase()];
  }

  onTypeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.digitalocean.size = size;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  sizeDisplayName(slug: string): string {
    const size = [...this._sizes.optimized, ...this._sizes.standard].find(size => size.slug === slug);
    const memoryBase = 1024;
    return size
      ? `${size.slug} (${size.memory / memoryBase} GB RAM, ${size.vcpus} CPU${size.vcpus !== 1 ? 's' : ''}, $${
          size.price_monthly
        } per month)`
      : '';
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this._sizes = DigitaloceanSizes.newDigitalOceanSizes();
    this.sizeLabel = SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: DigitaloceanSizes): void {
    this._sizes = sizes;
    this.selectedSize = this._nodeDataService.nodeData.spec.cloud.digitalocean.size;

    if (!this.selectedSize && this._sizes && this._sizes.standard && this._sizes.standard.length > 0) {
      this.selectedSize = this._sizes.standard[0].slug;
    }

    this.sizeLabel = this.selectedSize ? SizeState.Ready : SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    const slug = this._nodeDataService.nodeData.spec.cloud.digitalocean.size;
    const optimizedSize = this._sizes.optimized.find(size => size.slug === slug);
    const standardSize = this._sizes.standard.find(size => size.slug === slug);

    if (!optimizedSize && !standardSize) {
      return null;
    }

    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      doSize: {} as Standard | Optimized,
    };

    if (optimizedSize) {
      payload.doSize = {
        ...optimizedSize,
      };
    } else if (standardSize) {
      payload.doSize = {
        ...standardSize,
      };
    }

    if (
      !this._nodeDataService.isInWizardMode() &&
      !this._initialQuotaCalculationPayload &&
      !!this._nodeDataService.nodeData.creationTimestamp
    ) {
      this._initialQuotaCalculationPayload = {
        ...payload,
      };
    }

    if (this._initialQuotaCalculationPayload) {
      payload = {
        ...payload,
        replacedResources: this._initialQuotaCalculationPayload,
      } as ResourceQuotaCalculationPayload;
    }

    return payload;
  }
}
