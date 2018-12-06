import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatTabChangeEvent} from '@angular/material';
import {Subscription} from 'rxjs';

import {ApiService, DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeService} from '../../../core/services/node/node.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec} from '../../../shared/entity/NodeEntity';
import {NodeData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-nodes-modal.component.html',
  styleUrls: ['./add-nodes-modal.component.scss'],
})
export class AddNodesModalComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @Input() existingNodesCount: number;
  nodeDC: DataCenterEntity;
  addNodesData: NodeData = this.getInitialNodeData();
  private subscriptions: Subscription[] = [];
  private isNodeDeploymentAPIAvailable = false;

  constructor(
      private api: ApiService, private nodeDataService: NodeDataService, private nodeService: NodeService,
      private wizardService: WizardService, private dcService: DatacenterService,
      public googleAnalyticsService: GoogleAnalyticsService) {}

  private getInitialNodeData(): NodeData {
    return {
      spec: {
        cloud: {},
        operatingSystem: {},
        versions: {},
      },
      count: 1,
      valid: true,
    };
  }

  ngOnInit(): void {
    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe((result) => {
      this.nodeDC = result;
    });

    this.addNodesData.spec.cloud[this.nodeDC.spec.provider] = getEmptyNodeProviderSpec(this.nodeDC.spec.provider);
    this.addNodesData.spec.operatingSystem = getEmptyOperatingSystemSpec();
    this.addNodesData.spec.versions = getEmptyNodeVersionSpec();

    this.subscriptions.push(this.nodeDataService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.addNodesData = await data;
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
    return this.isNodeDeploymentAPIAvailable ? 'Add Node Deployment' : 'Add Nodes';
  }

  addNodes(): void {
    this.nodeService.createNodes(this.addNodesData, this.datacenter, this.cluster, this.projectID);
  }
}
