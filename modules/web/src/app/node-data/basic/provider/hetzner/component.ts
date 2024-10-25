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

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {DynamicModule} from '@app/dynamic/module-registry';
import {FilteredComboboxComponent} from '@app/shared/components/combobox/component';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {GlobalModule} from '@core/services/global/module';
import {NodeDataService} from '@core/services/node-data/service';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {HetznerNodeSpec, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {HetznerImage, HetznerTypes, Type} from '@shared/entity/provider/hetzner';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _, {merge} from 'lodash';
import {Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Type = 'type',
  Image = 'image',
}

enum GroupTypes {
  Dedicated = 'Dedicated vCPU Instances',
  Standard = 'Standard Instances',
}

enum TypeState {
  Ready = 'Node Type',
  Loading = 'Loading...',
  Empty = 'No Node Types Available',
}

enum ImageState {
  Ready = 'Image',
  Loading = 'Loading...',
  Empty = 'No Images Available',
}

@Component({
  selector: 'km-hetzner-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HetznerBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HetznerBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HetznerBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @ViewChild('imagesCombobox')
  private readonly _imagesCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  private _quotaCalculationService: QuotaCalculationService;
  private _types: HetznerTypes = HetznerTypes.newHetznerTypes();
  images: HetznerImage[] = [];
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  selectedType = '';
  selectedImage = '';
  typeLabel = TypeState.Empty;
  imageLabel = ImageState.Empty;

  get groups(): string[] {
    return Object.values(GroupTypes);
  }

  private get _typesObservable(): Observable<HetznerTypes> {
    return this._nodeDataService.hetzner.flavors(this._clearType.bind(this), this._onTypeLoading.bind(this));
  }

  private get _imagesObservable(): Observable<HetznerImage[]> {
    return this._nodeDataService.hetzner.images(this._clearImage.bind(this), this._onImageLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Type]: this._builder.control('', Validators.required),
      [Controls.Image]: this._builder.control(''),
    });

    this._typesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultType.bind(this));
    this._imagesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultImage.bind(this));

    this._nodeDataService.nodeData = this._getNodeData();

    merge(this.form.get(Controls.Type).valueChanges, this.form.get(Controls.Image).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.nodeData = this._getNodeData();
        if (this.isEnterpriseEdition) {
          const payload = this._getQuotaCalculationPayload();
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTypes(group: GroupTypes): Type[] {
    const key = Object.keys(GroupTypes).find(key => GroupTypes[key] === group);
    return this._types[key.toLowerCase()];
  }

  onTypeChange(type: string): void {
    this._nodeDataService.nodeData.spec.cloud.hetzner.type = type;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onImageChange(image: string): void {
    this.selectedImage = image;
    this._nodeDataService.nodeData.spec.cloud.hetzner.image = image;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  typeDisplayName(name: string): string {
    const type = [...this._types.dedicated, ...this._types.standard].find(type => type.name === name);
    return type ? `${type.name} (${type.cores} vCPU, ${type.memory} GB RAM)` : '';
  }

  private _onTypeLoading(): void {
    this._clearType();
    this.typeLabel = TypeState.Loading;
    this._cdr.detectChanges();
  }

  private _clearType(): void {
    this.selectedType = '';
    this._types = HetznerTypes.newHetznerTypes();
    this.typeLabel = TypeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultType(types: HetznerTypes): void {
    this._types = types;
    this.selectedType = this._nodeDataService.nodeData.spec.cloud.hetzner
      ? this._nodeDataService.nodeData.spec.cloud.hetzner.type
      : '';

    if (!this.selectedType && this._types && this._types.standard && !_.isEmpty(this._types.standard)) {
      this.selectedType = this._types.standard[0].name;
    }

    this.typeLabel = this.selectedType ? TypeState.Ready : TypeState.Empty;
    this._cdr.detectChanges();
  }

  private _onImageLoading(): void {
    this.imageLabel = ImageState.Loading;
    this._cdr.detectChanges();
  }

  private _clearImage(): void {
    this.selectedImage = '';
    this.images = [];
    this._imagesCombobox.reset();
    this.imageLabel = ImageState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultImage(images: HetznerImage[]): void {
    this.images = images;

    // Sort images by name
    this.images.sort((a, b) => a.name.localeCompare(b.name));

    this.selectedImage = this._nodeDataService.nodeData.spec.cloud.hetzner?.image;
    if (this.selectedImage && !this.images.find(image => image.name === this.selectedImage)) {
      this.onImageChange('');
    }

    this.imageLabel = this.images ? ImageState.Ready : ImageState.Empty;
    this._cdr.detectChanges();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          hetzner: {
            // network has to be the same as specified in cluster spec
            network: this._clusterSpecService.cluster.spec.cloud.hetzner.network,
          } as HetznerNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    const type = this._nodeDataService.nodeData.spec.cloud.hetzner.type;
    const types = [...this._types.dedicated, ...this._types.standard];
    const selectedType = types.find(s => s.name === type);

    if (!selectedType) {
      return null;
    }

    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      hetznerSize: {
        ...selectedType,
      } as Type,
    };

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
