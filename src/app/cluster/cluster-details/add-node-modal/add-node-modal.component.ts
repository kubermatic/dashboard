import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService, WizardService, ProjectService } from '../../../core/services';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { Subscription, Observable, ObservableInput, combineLatest } from 'rxjs';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { getEmptyNodeProviderSpec, getEmptyOperatingSystemSpec, getEmptyNodeVersionSpec, NodeEntity } from '../../../shared/entity/NodeEntity';
import { NodeData } from '../../../shared/model/NodeSpecChange';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-node-modal.component.html',
  styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @Input() existingNodesCount: number;
  private subscriptions: Subscription[] = [];
  public nodeDC: DataCenterEntity;
  public addNodeData: NodeData = {
    node: {
      spec: {
        cloud: {},
        operatingSystem: {},
        versions: {}
      },
      status: {},
    },
    count: 1,
    valid: true
  };

  constructor(private api: ApiService,
              private addNodeService: AddNodeService,
              private wizardService: WizardService,
              private dcService: DatacenterService,
              public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe(result => {
        this.nodeDC = result;
      }
    );

    this.addNodeData.node.spec.cloud[this.nodeDC.spec.provider] = getEmptyNodeProviderSpec(this.nodeDC.spec.provider);
    this.addNodeData.node.spec.operatingSystem = getEmptyOperatingSystemSpec();
    this.addNodeData.node.spec.versions = getEmptyNodeVersionSpec();

    this.subscriptions.push(this.addNodeService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.addNodeData = await data;
    }));

    this.googleAnalyticsService.emitEvent('clusterOverview', 'addNodeDialogOpened');
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public addNode(): void {
    const createNodeObservables: Array<ObservableInput<NodeEntity>> = [];
    for (let i = 0; i < this.addNodeData.count; i++) {
      createNodeObservables.push(this.api.createClusterNode(this.cluster, this.addNodeData.node, this.datacenter.metadata.name, this.projectID));
    }

    this.subscriptions.push(combineLatest(createNodeObservables).subscribe(() => {
      NotificationActions.success('Success', `Node(s) successfully created`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeAdded');
    }));
  }

  public changeView(event: MatTabChangeEvent): void {
    switch (event.tab.textLabel) {
      case 'Simple':
        return this.wizardService.changeSettingsFormView({hideOptional: true});
      case 'Extended':
        return this.wizardService.changeSettingsFormView({hideOptional: false});
      default:
        return this.wizardService.changeSettingsFormView({hideOptional: true});
    }
  }
}
