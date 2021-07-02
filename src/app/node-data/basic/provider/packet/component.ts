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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import * as _ from 'lodash';
import {Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec, PacketNodeSpec} from '@shared/entity/node';
import {PacketSize} from '@shared/entity/provider/packet';
import {NodeData} from '@shared/model/NodeSpecChange';
import {compare} from '@shared/utils/common-utils';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  InstanceType = 'instanceType',
}

enum SizeState {
  Ready = 'Plan',
  Loading = 'Loading...',
  Empty = 'No Plans Available',
}

@Component({
  selector: 'km-packet-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PacketBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PacketBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacketBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewInit {
  readonly Controls = Controls;

  sizes: PacketSize[] = [];
  selectedSize = '';
  sizeLabel = SizeState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  private get _sizesObservable(): Observable<PacketSize[]> {
    return this._nodeDataService.packet.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
    });
  }

  ngAfterViewInit() {
    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData = {
      spec: {
        cloud: {
          packet: {
            instanceType: size,
          } as PacketNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  getPlanDetails(size: PacketSize): string {
    let description = '';
    size.drives = size.drives ? size.drives : [];
    size.cpus = size.cpus ? size.cpus : [];

    for (const cpu of size.cpus) {
      description += `${cpu.count} CPU(s) ${cpu.type}`;
    }

    if (size.memory && size.memory !== 'N/A') {
      description += `, ${size.memory} RAM`;
    }

    for (const drive of size.drives) {
      description += `, ${drive.count}x${drive.size} ${drive.type}`;
    }

    return description ? `(${description})` : '';
  }

  sizeDisplayName(sizeName: string): string {
    const size = this.sizes.find(size => size.name === sizeName);
    if (!size) {
      return sizeName;
    }

    return `${size.name} ${this.getPlanDetails(size)}`;
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this.sizes = [];
    this.sizeLabel = SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: PacketSize[]): void {
    this.sizes = sizes.filter(size => size.memory !== 'N/A');
    this.selectedSize = this._nodeDataService.nodeData.spec.cloud.packet
      ? this._nodeDataService.nodeData.spec.cloud.packet.instanceType
      : '';

    if (!this.selectedSize && !_.isEmpty(this.sizes)) {
      this.selectedSize = this._findCheapestInstance(this.sizes).name;
    }

    this.sizeLabel = this.selectedSize ? SizeState.Ready : SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _findCheapestInstance(sizes: PacketSize[]): PacketSize {
    // Avoid mutating original array
    return [...sizes]
      .sort((a, b) => compare(this._getMemory(a), this._getMemory(b)))
      .sort((a, b) => compare(this._getCPUCount(a), this._getCPUCount(b)))[0];
  }

  private _getMemory(size: PacketSize): number {
    return Number.parseInt(size.memory);
  }

  private _getCPUCount(size: PacketSize): number {
    return size.cpus ? size.cpus.map(s => s.count).reduce((a, b) => a + b) : -1;
  }
}
