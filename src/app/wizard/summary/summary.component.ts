import { NodeProvider } from './../../shared/model/NodeProviderConstants';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateNodeModel } from '../../shared/model/CreateNodeModel';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { ApiService } from 'app/core/services/api/api.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  public providerNames = NodeProvider.ProviderNames;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  @select(['wizard', 'setDatacenterForm', 'datacenter']) region$: Observable<DataCenterEntity>;
  public region: DataCenterEntity;

  @select(['wizard', 'nodeModel']) nodeModel$: Observable<CreateNodeModel>;
  public nodeModel: CreateNodeModel;

  @select(['wizard', 'clusterModel']) clusterModel$: Observable<CreateClusterModel>;
  public clusterModel: CreateClusterModel;

  @select(['wizard', 'nodeForm', 'node_count']) nodeCount$: Observable<number>
  public nodeCount: number;

  public sshKeysList: string[] = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    const sub = this.provider$.combineLatest(this.region$, this.nodeModel$, this.clusterModel$, this.nodeCount$)
    .subscribe((data: [string, DataCenterEntity, CreateNodeModel, CreateClusterModel, number]) => {
      const provider = data[0];
      const region = data[1];
      const nodeModel = data[2];
      const clusterModel = data[3];
      const nodeCount = data[4];

      provider && (this.provider = provider);
      region && (this.region = region);
      nodeModel && (this.nodeModel = nodeModel);
      clusterModel && (this.clusterModel = clusterModel);
      nodeCount && (this.nodeCount = nodeCount);
    });
    this.subscriptions.push(sub);

    const sub2 = this.getSSHKeys();
    this.subscriptions.push(sub2);
  }

  public getSSHKeys(): Subscription {
    return this.api.getSSHKeys()
      .subscribe(
        result => {
          for (const item of result) {
            for (const key of this.clusterModel.sshKeys) {
              if (item.metadata.name === key) {
                this.sshKeysList.push(item.spec.name + ' - ' + item.spec.fingerprint);
              }
            }
          }
        }
      );
  }

  public goToStep(step: number): void {
    WizardActions.goToStep(step);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
