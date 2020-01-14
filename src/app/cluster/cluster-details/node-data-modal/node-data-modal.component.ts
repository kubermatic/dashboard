import {Component, EventEmitter, Inject, OnDestroy, OnInit, Output} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec, NodeSpec} from '../../../shared/entity/NodeEntity';
import {NodeData} from '../../../shared/model/NodeSpecChange';
import {objectDiff} from '../../../shared/utils/common-utils';

export interface NodeDataModalData {
  cluster: ClusterEntity;
  datacenter: DataCenterEntity;
  projectID: string;
  existingNodesCount: number;

  // Fields specific for edit mode (not required if using dialog to add new nodes).
  editMode?: boolean;
  nodeData?: NodeData;
  nodeDeployment?: NodeDeploymentEntity;
}

@Component({
  selector: 'kubermatic-node-data-modal',
  templateUrl: './node-data-modal.component.html',
  styleUrls: ['./node-data-modal.component.scss'],
})
export class NodeDataModalComponent implements OnInit, OnDestroy {
  @Output() editNodeDeployment = new EventEmitter<NodeDeploymentEntity>();
  nodeDC: DataCenterEntity;
  seedDC: DataCenterEntity;
  isExtended = false;
  isRecreationWarningVisible = false;
  nodeDataValid = false;
  private _initialNodeSpec: NodeSpec;
  private _unsubscribe = new Subject<void>();

  constructor(
      @Inject(MAT_DIALOG_DATA) public data: NodeDataModalData, private nodeDataService: NodeDataService,
      private wizardService: WizardService, private dcService: DatacenterService,
      public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.seedDC = this.data.datacenter;

    if (this.data.editMode && this.data.nodeDeployment) {
      // Using data.nodeDeployment as it is not a deep copy created using JSON parse & stringify like data.NodeData.
      this._initialNodeSpec = this.data.nodeDeployment.spec.template;
    }

    if (!this.data.nodeData) {
      this.data.nodeData = {
        spec: {
          cloud: {},
          operatingSystem: {},
          versions: {},
        },
        count: 1,
        valid: true,
        dynamicConfig: false,
      };
    }

    this.dcService.getDataCenter(this.data.cluster.spec.cloud.dc)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(result => this.nodeDC = result);

    if (this.data.editMode !== true) {
      this.data.nodeData.spec.cloud[this.nodeDC.spec.provider] = getEmptyNodeProviderSpec(this.nodeDC.spec.provider);
      this.data.nodeData.spec.operatingSystem = getEmptyOperatingSystemSpec();
      this.data.nodeData.spec.versions = getEmptyNodeVersionSpec();
    }

    this.nodeDataService.nodeDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(async data => {
      this.data.nodeData = await data;
      this.isRecreationWarningVisible = this._isRecreationWarningVisible();
    });

    this.googleAnalyticsService.emitEvent('clusterOverview', 'addNodeDialogOpened');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onViewChange(): void {
    this.isExtended = !this.isExtended;
    this.wizardService.changeSettingsFormView({hideOptional: !this.isExtended});
  }

  private _isRecreationWarningVisible(): boolean {
    return this.data.editMode && !_.isEqual(objectDiff(this._initialNodeSpec, this.data.nodeData.spec), {});
  }

  getDialogLabel(): string {
    return `${this.data.editMode ? 'Edit' : 'Add'} Node Deployment`;
  }
}
