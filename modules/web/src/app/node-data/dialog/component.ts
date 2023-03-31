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

import {ChangeDetectionStrategy, Component, forwardRef, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {NodeDataService} from '@core/services/node-data/service';
import _ from 'lodash';
import {merge, of} from 'rxjs';
import {delay, takeUntil} from 'rxjs/operators';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {Cluster, END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION} from '@shared/entity/cluster';
import {getDefaultNodeProviderSpec, NodeSpec} from '@shared/entity/node';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {getIconClassForButton, objectDiff} from '@shared/utils/common';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {NodeDataMode} from '../config';
import {ExternalMachineDeployment} from '@app/shared/entity/external-machine-deployment';
import {ExternalCluster} from '@app/shared/entity/external-cluster';
import {QuotaCalculationService} from '@app/dynamic/enterprise/quotas/services/quota-calculation';
import {coerce, lt} from 'semver';

enum Mode {
  Edit = 'Edit',
  Add = 'Add',
}

enum Controls {
  NodeData = 'nodeData',
}

export interface DialogDataInput {
  // If provided, data will be reused to pre-fill fields.
  initialClusterData?: Cluster;
  initialExternalClusterData?: ExternalCluster;
  initialNodeData?: NodeData;
  projectID?: string;
}

export interface DialogDataOutput {
  nodeData?: NodeData;
  externalMachineDeploymentData?: ExternalMachineDeployment;
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
  readonly endOfDynamicKubeletConfigSupportVersion: string = END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION;

  isRecreationWarningVisible = false;
  isDynamicKubeletConfigWarningVisible = false;
  isQuotaExceeded: boolean;
  mode = Mode.Add;

  readonly Control = Controls;

  private _output: DialogDataOutput = {nodeData: NodeData.NewEmptyNodeData()} as DialogDataOutput;
  private readonly _initDelay = 250;

  get provider(): NodeProvider {
    return this._clusterSpecService.provider;
  }

  get clusterName(): string {
    return this._data.initialClusterData.name;
  }

  get machineDeploymentName(): string {
    return this._data.initialNodeData.name;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: DialogDataInput,
    private _dialogRef: MatDialogRef<NodeDataDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _quotaCalculationService: QuotaCalculationService
  ) {
    super();
  }

  ngOnInit() {
    this._nodeDataService.reset();
    this._clusterSpecService.reset();

    this.form = this._builder.group({
      [Controls.NodeData]: this._builder.control(''),
    });

    this._clusterSpecService.cluster = this._data.initialClusterData;
    this._nodeDataService.nodeData = this._initNodeData();
    this.mode =
      this._nodeDataService.mode === NodeDataMode.Dialog && !!this._nodeDataService.nodeData.name
        ? Mode.Edit
        : Mode.Add;

    if (this.mode === Mode.Edit) {
      this.isDynamicKubeletConfigWarningVisible =
        this._nodeDataService.nodeData.dynamicConfig &&
        lt(
          coerce(this._nodeDataService.nodeData.spec.versions.kubelet),
          coerce(this.endOfDynamicKubeletConfigSupportVersion)
        );
    }

    const key = `${this._data.projectID}-${this.provider}`;
    this._quotaCalculationService.reset(key);

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

    this._quotaCalculationService
      .getQuotaExceed()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(isQuotaExceeded => {
        this.isQuotaExceeded = isQuotaExceeded;
      });
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasExtendedOptions(): boolean {
    // List of providers that do not have extended options right now.
    const blacklist = [NodeProvider.HETZNER, NodeProvider.BRINGYOUROWN, NodeProvider.ANEXIA, NodeProvider.KUBEVIRT];
    return !blacklist.includes(this._clusterSpecService.provider);
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

  getIconClass(): string {
    return getIconClassForButton(this.mode);
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
          [this._clusterSpecService.provider]: getDefaultNodeProviderSpec(this._clusterSpecService.provider),
        },
        operatingSystem: {},
        versions: {},
      } as NodeSpec,
      count: 1,
      dynamicConfig: false,
    } as NodeData;
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
