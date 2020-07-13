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

import {ChangeDetectionStrategy, Component, forwardRef, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import * as _ from 'lodash';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Cluster} from '../../shared/entity/cluster';
import {getEmptyNodeProviderSpec} from '../../shared/entity/node';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {ClusterService} from '../../shared/services/cluster.service';
import {objectDiff} from '../../shared/utils/common-utils';
import {BaseFormValidator} from '../../shared/validators/base-form.validator';
import {NodeDataService} from '../service/service';

enum Mode {
  Edit = 'Edit',
  Add = 'Add',
}

enum Controls {
  NodeData = 'nodeData',
}

export interface DialogDataInput {
  existingNodesCount: number;

  // If provided, data will be reused to pre-fill fields.
  initialClusterData?: Cluster;
  initialNodeData?: NodeData;
}

export interface DialogDataOutput {
  nodeData: NodeData;
}

@Component({
  selector: 'km-node-data-dialog',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NodeDataDialogComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NodeDataDialogComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDataDialogComponent extends BaseFormValidator implements OnInit, OnDestroy {
  isRecreationWarningVisible = false;
  isExtended = false;

  readonly Control = Controls;

  private _output: DialogDataOutput = {nodeData: NodeData.NewEmptyNodeData()} as DialogDataOutput;

  get provider(): NodeProvider {
    return this._clusterService.provider;
  }

  get mode(): Mode {
    return this._nodeDataService.isInDialogEditMode() ? Mode.Edit : Mode.Add;
  }

  get existingNodesCount(): number {
    return this._data.existingNodesCount;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: DialogDataInput,
    private _dialogRef: MatDialogRef<NodeDataDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit() {
    this._nodeDataService.reset();

    this.form = this._builder.group({
      [Controls.NodeData]: this._builder.control(''),
    });

    this._clusterService.cluster = this._data.initialClusterData;
    this._nodeDataService.nodeData = this._initNodeData();

    merge(this._nodeDataService.nodeDataChanges, this._nodeDataService.operatingSystemChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._output.nodeData = this._nodeDataService.nodeData;
        this.isRecreationWarningVisible = this._isRecreationWarningVisible();
      });
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasExtendedOptions(): boolean {
    // List of providers that do not have extended options right now.
    const blacklist = [NodeProvider.HETZNER, NodeProvider.BRINGYOUROWN];
    return !blacklist.includes(this._clusterService.provider);
  }

  onViewChange(): void {
    this.isExtended = !this.isExtended;
  }

  onConfirm(): void {
    this._dialogRef.close(this._output);
  }

  private _initNodeData(): NodeData {
    if (this._data.initialNodeData) {
      this._nodeDataService.operatingSystemSpec = this._data.initialNodeData.spec.operatingSystem;
      return this._data.initialNodeData;
    }

    return {
      spec: {
        cloud: {
          [this._clusterService.provider]: getEmptyNodeProviderSpec(this._clusterService.provider),
        },
        operatingSystem: {},
        versions: {},
      },
      count: 1,
      dynamicConfig: false,
    };
  }

  private _isRecreationWarningVisible(): boolean {
    return this.mode === Mode.Edit && !_.isEqual(objectDiff(this._data.initialNodeData, this._output.nodeData), {});
  }
}
