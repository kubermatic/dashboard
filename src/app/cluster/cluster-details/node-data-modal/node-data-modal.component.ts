import {Component, EventEmitter, Inject, OnDestroy, OnInit, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatTabChangeEvent} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec} from '../../../shared/entity/NodeEntity';
import {NodeData} from '../../../shared/model/NodeSpecChange';

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
  isExtended = false;
  private _unsubscribe = new Subject<void>();

  constructor(
      @Inject(MAT_DIALOG_DATA) public data: NodeDataModalData, private nodeDataService: NodeDataService,
      private wizardService: WizardService, private dcService: DatacenterService,
      public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    if (!this.data.nodeData) {
      this.data.nodeData = {
        spec: {
          cloud: {},
          operatingSystem: {},
          versions: {},
        },
        count: 1,
        valid: true,
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

    this.nodeDataService.nodeDataChanges$.pipe(takeUntil(this._unsubscribe))
        .subscribe(async data => this.data.nodeData = await data);

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

  getDialogLabel() {
    return `${this.data.editMode ? 'Edit' : 'Add'} Node Deployment`;
  }
}
