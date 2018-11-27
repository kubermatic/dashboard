import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatTabChangeEvent} from '@angular/material';
import {combineLatest, ObservableInput, Subscription} from 'rxjs';
import {ApiService, DatacenterService, WizardService} from '../../../core/services';
import {AddNodeService} from '../../../core/services/add-node/add-node.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec, NodeEntity} from '../../../shared/entity/NodeEntity';
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
  nodeDC: DataCenterEntity;
  addNodesData: NodeData = this.getInitialNodeData();
  private subscriptions: Subscription[] = [];
  private isNodeDeploymentAPIAvailable = false;

  constructor(
      private api: ApiService, private addNodeService: AddNodeService, private wizardService: WizardService,
      private dcService: DatacenterService, public googleAnalyticsService: GoogleAnalyticsService) {}

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

    this.subscriptions.push(this.addNodeService.nodeDataChanges$.subscribe(async (data: NodeData) => {
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
    if (this.isNodeDeploymentAPIAvailable) {
      this.createNodeDeployment();
    } else {
      this.createNodes();
    }
  }

  private createNodeDeployment(): void {
    const createObservables: Array<ObservableInput<any>> = [];
    createObservables.push(this.api.createClusterNodeDeployment(
        this.cluster, this.getNodeDeploymentEntity(), this.datacenter.metadata.name, this.projectID));
    this.observeCreation(createObservables, 'Node Deployment successfully created');
  }

  private getNodeDeploymentEntity(): NodeDeploymentEntity {
    return {
      spec: {
        template: this.addNodesData.spec,
        replicas: this.addNodesData.count,
      },
    };
  }

  private createNodes(): void {
    const createObservables: Array<ObservableInput<any>> = [];
    for (let i = 0; i < this.addNodesData.count; i++) {
      createObservables.push(this.api.createClusterNode(
          this.cluster, this.getNodeEntity(), this.datacenter.metadata.name, this.projectID));
    }
    this.observeCreation(createObservables, 'Node successfully created');
  }

  private getNodeEntity(): NodeEntity {
    return {
      spec: this.addNodesData.spec,
    };
  }

  private observeCreation(createObservables: Array<ObservableInput<any>>, successMessage: string): void {
    this.subscriptions.push(combineLatest(createObservables).subscribe((x) => {
      NotificationActions.success('Success', successMessage);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeAdded');
    }));
  }
}
