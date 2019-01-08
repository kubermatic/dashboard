import {Component, EventEmitter, Inject, OnDestroy, OnInit, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatTabChangeEvent} from '@angular/material';
import {Subscription} from 'rxjs';

import {ApiService, DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeService} from '../../../core/services/node/node.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeDeploymentPatch} from '../../../shared/entity/NodeDeploymentPatch';
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
  private subscriptions: Subscription[] = [];
  private isNodeDeploymentAPIAvailable = false;

  constructor(
      @Inject(MAT_DIALOG_DATA) public data: NodeDataModalData, private api: ApiService,
      private nodeDataService: NodeDataService, private nodeService: NodeService, private wizardService: WizardService,
      private dcService: DatacenterService, public googleAnalyticsService: GoogleAnalyticsService) {}

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

    this.dcService.getDataCenter(this.data.cluster.spec.cloud.dc).subscribe((result) => {
      this.nodeDC = result;
    });

    if (this.data.editMode !== true) {
      this.data.nodeData.spec.cloud[this.nodeDC.spec.provider] = getEmptyNodeProviderSpec(this.nodeDC.spec.provider);
      this.data.nodeData.spec.operatingSystem = getEmptyOperatingSystemSpec();
      this.data.nodeData.spec.versions = getEmptyNodeVersionSpec();
    }

    this.subscriptions.push(this.nodeDataService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.data.nodeData = await data;
    }));

    this.isNodeDeploymentAPIAvailable = this.api.isNodeDeploymentEnabled();
    this.googleAnalyticsService.emitEvent('clusterOverview', 'addNodeDialogOpened');
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.wizardService.changeSettingsFormView({hideOptional: event.tab.textLabel !== 'Extended'});
  }

  getDialogLabel() {
    return `${this.data.editMode ? 'Edit' : 'Add'} ${this.isNodeDeploymentAPIAvailable ? 'Node Deployment' : 'Node'}`;
  }

  performAction(): void {
    if (this.data.editMode) {
      this.api
          .patchNodeDeployment(
              this.data.nodeDeployment, this.createPatch(), this.data.cluster.id, this.data.datacenter.metadata.name,
              this.data.projectID)
          .toPromise()
          .then(
              (nd) => {
                NotificationActions.success('Success', 'Node Deployment updated successfully');
                this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentUpdated');
                this.editNodeDeployment.emit(nd);
              },
              () => {
                NotificationActions.error('Error', `Could not update Node Deployment`);
                this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentUpdateFailed');
              });
    } else {
      this.nodeService.createNodes(this.data.nodeData, this.data.datacenter, this.data.cluster, this.data.projectID);
    }
  }

  private createPatch(): NodeDeploymentPatch {
    const patch: NodeDeploymentPatch = {
      spec: {
        replicas: this.data.nodeData.count,
        template: this.data.nodeData.spec,
      },
    };

    // As we are using merge patch to send whole spec we need to ensure that previous values will be unset
    // and replaced by the values from patch. That's why we need to set undefined fields to null.
    // It is not part of API service as it is not required in all cases (i.e. replicas count change).
    patch.spec.template.operatingSystem.ubuntu = patch.spec.template.operatingSystem.ubuntu || null;
    patch.spec.template.operatingSystem.centos = patch.spec.template.operatingSystem.centos || null;
    patch.spec.template.operatingSystem.containerLinux = patch.spec.template.operatingSystem.containerLinux || null;

    return patch;
  }
}
