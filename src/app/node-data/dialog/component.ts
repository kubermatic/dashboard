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
import {merge, of} from 'rxjs';
import {delay, takeUntil} from 'rxjs/operators';
import {Cluster} from '../../shared/entity/cluster';
import {getEmptyNodeProviderSpec} from '../../shared/entity/node';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {ClusterService} from '../../shared/services/cluster.service';
import {objectDiff} from '../../shared/utils/common-utils';
import {BaseFormValidator} from '../../shared/validators/base-form.validator';
import {NodeDataMode} from '../config';
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
  mode = Mode.Add;

  readonly Control = Controls;

  private _output: DialogDataOutput = {nodeData: NodeData.NewEmptyNodeData()} as DialogDataOutput;
  private readonly _initDelay = 250;

  get provider(): NodeProvider {
    return this._clusterService.provider;
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
    this._clusterService.reset();

    this.form = this._builder.group({
      [Controls.NodeData]: this._builder.control(''),
    });

    this._clusterService.cluster = this._data.initialClusterData;
    this._nodeDataService.nodeData = this._initNodeData();
    this.mode =
      this._nodeDataService.mode === NodeDataMode.Dialog && !!this._nodeDataService.nodeData.name
        ? Mode.Edit
        : Mode.Add;

    merge(this._nodeDataService.nodeDataChanges, this._nodeDataService.operatingSystemChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._updateNodeData.bind(this));

    of(true)
      .pipe(delay(this._initDelay))
      .subscribe(() => {
        // Add and initialize with default values all properties that are missing in initial node data
        _.defaultsDeep(this._data.initialNodeData, this._nodeDataService.nodeData);
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

  getConfirmButtonText(): string {
    switch (this.mode) {
      case Mode.Add:
        return 'Add Machine Deployment';
      case Mode.Edit:
        return 'Save Changes';
      default:
        return 'Add Machine Deployment';
    }
  }

  private _updateNodeData(): void {
    this._output.nodeData = this._nodeDataService.nodeData;
    this.isRecreationWarningVisible = this._isRecreationWarningVisible();
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
    // the icon should not be displayed if only the node replica has changed,
    // but of course it should be displayed if something else (also) has changed
    const diff = objectDiff(this._data.initialNodeData, this._output.nodeData);
    return (
      this.mode === Mode.Edit &&
      !_.isEqual(diff, {}) &&
      !(Object.keys(diff).length === 1 && Object.prototype.hasOwnProperty.call(diff, 'count'))
    );
  }
}
