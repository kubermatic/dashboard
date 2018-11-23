import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { combineLatest, ObservableInput, Subscription } from 'rxjs';
import { ApiService, WizardService } from '../../../core/services';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec, NodeEntity } from '../../../shared/entity/NodeEntity';
import { NodeData } from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-node-modal.component.html',
  styleUrls: ['./add-node-modal.component.scss'],
})
export class AddNodeModalComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  private subscriptions: Subscription[] = [];
  public nodeDC: DataCenterEntity;
  public addNodeData: NodeData = {
      spec: {
        cloud: {},
        operatingSystem: {},
        versions: {},
      },
    count: 1,
    valid: true,
  };

  constructor(private api: ApiService,
              private addNodeService: AddNodeService,
              private wizardService: WizardService,
              private dcService: DatacenterService,
              public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe((result) => {
        this.nodeDC = result;
      },
    );

    this.addNodeData.spec.cloud[this.nodeDC.spec.provider] = getEmptyNodeProviderSpec(this.nodeDC.spec.provider);
    this.addNodeData.spec.operatingSystem = getEmptyOperatingSystemSpec();
    this.addNodeData.spec.versions = getEmptyNodeVersionSpec();

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
      const node = {
        spec: this.addNodeData.spec,
      } as NodeEntity;
      createNodeObservables.push(this.api.createClusterNode(this.cluster, node, this.datacenter.metadata.name, this.projectID));
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
