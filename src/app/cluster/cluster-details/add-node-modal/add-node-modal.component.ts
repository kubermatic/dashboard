import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { NodeData } from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-node-modal.component.html',
  styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public addNodeData: NodeData = {};
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService) {}

  ngOnInit(): void {
    this.subscriptions.push(this.addNodeService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.addNodeData = await data;
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public addNode(): void {
    const createNodeObservables: Array<ObservableInput<NodeEntity>> = [];
    for (let i = 0; i < this.addNodeData.count; i++) {
      createNodeObservables.push(this.api.createClusterNode(this.cluster, this.addNodeData.node, this.datacenter.metadata.name));
    }
    this.subscriptions.push(Observable.combineLatest(createNodeObservables)
      .subscribe((createdNodes: NodeEntity[]): void => {
        NotificationActions.success('Success', `Node(s) successfully created`);
      }));
  }
}
