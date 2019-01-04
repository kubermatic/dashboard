import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MatTabChangeEvent} from '@angular/material';
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

@Component({
  selector: 'kubermatic-node-data-modal',
  templateUrl: './node-data-modal.component.html',
  styleUrls: ['./node-data-modal.component.scss'],
})
export class NodeDataModalComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @Input() existingNodesCount: number;
  @Input() nodeData: NodeData;

  // Fields specific for edit mode (not required if using dialog to add new nodes).
  @Input() editMode = false;
  @Input() nodeDeploymentId: string;
  @Output() editNodeDeployment = new EventEmitter<NodeDeploymentEntity>();

  nodeDC: DataCenterEntity;
  private subscriptions: Subscription[] = [];
  private isNodeDeploymentAPIAvailable = false;

  constructor(
      private api: ApiService, private nodeDataService: NodeDataService, private nodeService: NodeService,
      private wizardService: WizardService, private dcService: DatacenterService,
      public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    if (!this.nodeData) {
      this.nodeData = {
        spec: {
          cloud: {},
          operatingSystem: {},
          versions: {},
        },
        count: 1,
        valid: true,
      };
    }

    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe((result) => {
      this.nodeDC = result;
    });

    this.nodeData.spec.cloud[this.nodeDC.spec.provider] = getEmptyNodeProviderSpec(this.nodeDC.spec.provider);
    this.nodeData.spec.operatingSystem = getEmptyOperatingSystemSpec();
    this.nodeData.spec.versions = getEmptyNodeVersionSpec();

    this.subscriptions.push(this.nodeDataService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.nodeData = await data;
    }));

    this.isNodeDeploymentAPIAvailable = this.api.isNodeDeploymentAPIAvailable();
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
    return `${this.editMode ? 'Edit' : 'Add'} ${this.isNodeDeploymentAPIAvailable ? 'Node Deployment' : 'Node'}`;
  }

  performAction(): void {
    if (this.editMode) {
      const patch: NodeDeploymentPatch = {
        spec: {
          replicas: this.nodeData.count,
          template: this.nodeData.spec,
        },
      };
      this.api
          .patchNodeDeployment(
              this.nodeDeploymentId, patch, this.cluster.id, this.datacenter.metadata.name, this.projectID)
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
      this.nodeService.createNodes(this.nodeData, this.datacenter, this.cluster, this.projectID);
    }
  }
}
