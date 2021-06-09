// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {HetznerNodeSpec, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {HetznerTypes, Type} from '@shared/entity/provider/hetzner';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Type = 'type',
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
  private _types: HetznerTypes = HetznerTypes.newHetznerTypes();

  readonly Controls = Controls;

  selectedType = '';
  typeLabel = TypeState.Empty;

  get groups(): string[] {
    return Object.values(GroupTypes);
  }

  private get _typesObservable(): Observable<HetznerTypes> {
    return this._nodeDataService.hetzner.flavors(this._clearType.bind(this), this._onTypeLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Type]: this._builder.control('', Validators.required),
    });

    this._typesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultType.bind(this));

    this._nodeDataService.nodeData = this._getNodeData();

    this._clusterSpecService.clusterChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
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
}
