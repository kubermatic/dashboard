import { AddNodeModalComponent } from './add-node-modal/add-node-modal.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/observable/combineLatest';
import { environment } from '../../../environments/environment';
import { ClusterConnectComponent } from './cluster-connect/cluster-connect.component';
import { ClusterEntity, getClusterProvider, isClusterRunning, getClusterHealthStatus } from '../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { ApiService, DatacenterService, InitialNodeDataService } from '../../core/services';
import { NodeProvider } from '../../shared/model/NodeProviderConstants';
import { AddNodeModalData } from '../../shared/model/add-node-modal-data';
import 'rxjs/add/observable/interval';
import { Subject } from 'rxjs/Subject';
import { NodeEntity } from '../../shared/entity/NodeEntity';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { NotificationActions } from '../../redux/actions/notification.actions';

@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.scss']
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {
  public cluster: ClusterEntity;
  public nodeDc: DataCenterEntity;
  public datacenter: DataCenterEntity;
  public sshKeys: SSHKeyEntity[] = [];
  public nodes: NodeEntity[] = [];
  public stateOfTheAccordion: object[];
  public isClusterRunning: boolean;
  public clusterHealthClass: string;
  private clusterSubject: Subject<ClusterEntity>;
  private upgradesList: string[] = [];
  private unsubscribe: Subject<any> = new Subject();
  private refreshInterval = 10000;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private api: ApiService,
              public dialog: MatDialog,
              private initialNodeDataService: InitialNodeDataService,
              private dcService: DatacenterService) {
    this.clusterSubject = new Subject<ClusterEntity>();
  }

  public ngOnInit(): void {
    const clusterName = this.route.snapshot.paramMap.get('clusterName');
    const seedDCName = this.route.snapshot.paramMap.get('seedDc');

    // Node datacenter & ssh keys - both once
    const onceSub = this.clusterSubject
      .subscribe(cluster => {

        this.dcService.getDataCenter(cluster.spec.cloud.dc)
          .takeUntil(this.unsubscribe)
          .subscribe(datacenter => {
            this.nodeDc = datacenter;
          });

        this.api.getSSHKeys()
          .takeUntil(this.unsubscribe)
          .subscribe(keys => {
            this.sshKeys = keys.filter(key => {
              if (key.spec.clusters == null) {
                return false;
              }
              return key.spec.clusters.indexOf(cluster.metadata.name) > -1;
            });
          });

        onceSub.unsubscribe();
      });

    // Upgrades
    this.clusterSubject
      .takeUntil(this.unsubscribe)
      .subscribe(cluster => {
        if (cluster && cluster.status && cluster.status.health && cluster.status.health.apiserver && cluster.status.health.machineController) {
          this.api.getClusterUpgrades(cluster.metadata.name, seedDCName)
            .takeUntil(this.unsubscribe)
            .subscribe(upgrades => {
              this.upgradesList = upgrades;
            });
        }
      });
    // Nodes
    this.clusterSubject
      .takeUntil(this.unsubscribe)
      .subscribe(cluster => {
        this.reloadClusterNodes();
      });

    // Initial node creation
    const initialNodeCreationSub = this.clusterSubject
      .takeUntil(this.unsubscribe)
      .subscribe(cluster => {
        const data = this.initialNodeDataService.getInitialNodeData(cluster);
        if (data == null) {
          if (initialNodeCreationSub) {
            initialNodeCreationSub.unsubscribe();
            return;
          }
        }

        if (cluster && cluster.status && cluster.status.health && cluster.status.health.apiserver && cluster.status.health.machineController) {
          const createNodeObservables: Array<ObservableInput<NodeEntity>> = [];
          for (let i = 0; i < data.nodeCount; i++) {
            createNodeObservables.push(this.api.createClusterNode(cluster, data.node, this.datacenter.metadata.name));
          }
          Observable.combineLatest(createNodeObservables)
            .takeUntil(this.unsubscribe)
            .subscribe((createdNodes: NodeEntity[]): void => {
              NotificationActions.success('Success', `Node(s) successfully created`);
              this.reloadClusterNodes();
            });
          this.initialNodeDataService.clearInitialNodeData(cluster);
        }
      });

    Observable.combineLatest(this.dcService.getDataCenter(seedDCName), this.api.getCluster(clusterName, seedDCName))
      .takeUntil(this.unsubscribe)
      .retry(3)
      .subscribe(
        (data: any[]): void => {
          this.datacenter = data[0];
          this.cluster = data[1];
          this.clusterSubject.next(data[1]);
          this.isClusterRunning = isClusterRunning(this.cluster);
          this.clusterHealthClass = getClusterHealthStatus(this.cluster);

          const timer = Observable.interval(this.refreshInterval);
          timer
            .takeUntil(this.unsubscribe)
            .subscribe(tick => {
              this.reloadCluster(clusterName, seedDCName);
            });
        },
        error => {
          if (error.status === 404) {
            this.router.navigate(['404']);
          }
        });
  }

  public ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public reloadCluster(clusterName: string, seedDCName: string): void {
    this.api.getCluster(clusterName, seedDCName)
      .takeUntil(this.unsubscribe)
      .retry(3)
      .subscribe(res => {
        this.cluster = res;
        this.clusterSubject.next(res);
      });

    this.isClusterRunning = isClusterRunning(this.cluster);
    this.clusterHealthClass = getClusterHealthStatus(this.cluster);
  }

  public reloadClusterNodes() {
    if (this.cluster && this.cluster.status && this.cluster.status.health && this.cluster.status.health.apiserver && this.cluster.status.health.machineController) {
      this.api.getClusterNodes(this.cluster.metadata.name, this.datacenter.metadata.name)
        .takeUntil(this.unsubscribe)
        .subscribe(nodes => {
          this.nodes = nodes;
        });
    }
  }

  public addNode(): void {
    const data = new AddNodeModalData(this.cluster, this.nodeDc);
    const modal = this.dialog.open(AddNodeModalComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;

    const sub = modal.afterClosed().subscribe(result => {
      this.reloadClusterNodes();
      sub.unsubscribe();
    });
  }

  public deleteClusterDialog(): void {
    const modal = this.dialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    const sub = modal.afterClosed().subscribe(deleted => {
      if (deleted) {
        this.router.navigate(['/clusters']);
      }
      sub.unsubscribe();
    });
  }

  public connectClusterDialog(): void {
    const modal = this.dialog.open(ClusterConnectComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
  }

  public upgradeClusterDialog(): void {
    const modal = this.dialog.open(UpgradeClusterComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.possibleVersions = this.upgradesList;
    const sub = modal.afterClosed().subscribe(() => {
      this.reloadCluster(this.cluster.metadata.name, this.datacenter.metadata.name);
      sub.unsubscribe();
    });
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem('token');
    return `${environment.restRootV3}/dc/${this.datacenter.metadata.name}/cluster/${this.cluster.metadata.name}/kubeconfig?token=${authorization_token}`;
  }

  public isLoaded(): boolean {
    if (this.cluster && getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN) {
      return true;
    } else if (this.cluster) {
      return !!this.nodeDc;
    }
  }
}
