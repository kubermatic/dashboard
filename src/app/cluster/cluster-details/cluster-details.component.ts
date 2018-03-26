import { AddNodeModalComponent } from './add-node-modal/add-node-modal.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import 'rxjs/add/operator/retry';
import { environment } from '../../../environments/environment';
import { ClusterConnectComponent } from './cluster-connect/cluster-connect.component';
import { NodeEntityV2 } from '../../shared/entity/NodeEntity';
import { ClusterEntity, getProvider } from '../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { ApiService, CreateNodesService, CustomEventService, DatacenterService } from '../../core/services';
import { NodeProvider } from '../../shared/model/NodeProviderConstants';
import { AddNodeModalData } from '../../shared/model/add-node-modal-data';
import { UpgradeClusterComponentData } from '../../shared/model/UpgradeClusterDialogData';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.scss']
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {
  private clusterSubject: Subject<ClusterEntity>;
  public cluster: ClusterEntity;
  public nodeDc: DataCenterEntity;
  public datacenter: DataCenterEntity;
  public nodes: NodeEntityV2[] = [];
  public sshKeys: SSHKeyEntity[] = [];
  private upgradesList: string[] = [];

  public dialogRef: any;
  public config: any = {};
  public stateOfTheAccordion: object[];

  constructor(private customEventService: CustomEventService,
              private route: ActivatedRoute,
              private router: Router,
              private api: ApiService,
              public dialog: MatDialog,
              private createNodesService: CreateNodesService,
              private dcService: DatacenterService) {
    this.clusterSubject = new Subject<ClusterEntity>();
  }

  public ngOnInit(): void {
    const clusterName = this.route.snapshot.paramMap.get('clusterName');
    const seedDCName = this.route.snapshot.paramMap.get('seedDc');
    this.dcService.getDataCenter(seedDCName)
      .subscribe(res => {
        this.datacenter = new DataCenterEntity(res.metadata, res.spec, res.seed);
      });

    const nodeDCSubscription = this.clusterSubject.subscribe(cluster => {
      this.dcService.getDataCenter(cluster.spec.cloud.dc)
        .subscribe(datacenter => {
          this.nodeDc = new DataCenterEntity(datacenter.metadata, datacenter.spec, datacenter.seed);
          nodeDCSubscription.unsubscribe();
        });
    });

    this.clusterSubject.subscribe(cluster => {
      this.api.getClusterUpgrades(cluster.metadata.name, seedDCName)
        .subscribe(upgrades => {
          this.upgradesList = upgrades;
        });
    });

    this.clusterSubject.subscribe(cluster => {
      if (cluster && cluster.status && cluster.status.health && cluster.status.health.apiserver) {
        this.reloadClusterNodes(clusterName, seedDCName);
      }
    });

    //Loads the keys once
    const sshKeySubscription = this.clusterSubject.subscribe(cluster => {
      this.api.getSSHKeys().subscribe(keys => {
        this.sshKeys = keys.filter(key => {
          if (key.spec.clusters == null) {
            return false;
          }
          return key.spec.clusters.indexOf(cluster.metadata.name) > -1;
        });
        sshKeySubscription.unsubscribe();
      });
    });

    const timer = Observable.interval(5000);
    timer.subscribe(tick => {
      this.reloadCluster(clusterName, seedDCName);
    });
    this.reloadCluster(clusterName, seedDCName);
  }

  public ngOnDestroy(): void {
  }

  public reloadClusterNodes(clusterName: string, seedDCName: string) {
    this.api.getClusterNodes(clusterName, seedDCName).subscribe(nodes => {
      this.nodes = nodes;
    });
  }

  public reloadCluster(clusterName: string, seedDCName: string): void {
    this.api.getCluster(clusterName, seedDCName).retry(3)
      .subscribe(
        res => {
          const clusterEntity: ClusterEntity = {
            metadata: res.metadata,
            spec: res.spec,
            address: res.address,
            status: res.status,
          };

          this.cluster = clusterEntity;
          this.clusterSubject.next(clusterEntity);
        },
        error => {
          if (error.status === 404) {
            this.router.navigate(['404']);
          }
        });
  }

  public addNode(): void {
    const data = new AddNodeModalData(this.cluster, this.nodeDc);
    this.dialogRef = this.dialog.open(AddNodeModalComponent, {data});
    this.dialogRef.afterClosed().subscribe(result => {
      this.reloadClusterNodes(this.cluster.metadata.name, this.datacenter.metadata.name);
    });
  }

  public deleteClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterDeleteConfirmationComponent, this.config);

    this.dialogRef.componentInstance.humanReadableName = this.cluster.spec.humanReadableName;
    this.dialogRef.componentInstance.clusterName = this.cluster.metadata.name;
    this.dialogRef.componentInstance.datacenter = this.datacenter;

    this.dialogRef.afterClosed().subscribe(result => {
    });
  }

  public connectClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterConnectComponent, this.config);
    this.dialogRef.componentInstance.clusterName = this.cluster.metadata.name;
    this.dialogRef.componentInstance.datacenter = this.datacenter;
  }

  public upgradeClusterDialog(): void {
    const dialogWidth = '500px';

    this.dialogRef = this.dialog.open(UpgradeClusterComponent, {
      data: new UpgradeClusterComponentData(this.cluster.metadata.name, this.upgradesList),
      width: dialogWidth
    }).afterClosed().subscribe(() => {
      this.reloadCluster(this.cluster.metadata.name, this.datacenter.metadata.name);
    });
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem('token');
    return `${environment.restRootV3}/dc/${this.datacenter.metadata.name}/cluster/${this.cluster.metadata.name}/kubeconfig?token=${authorization_token}`;
  }

  public clusterIsRunning(): boolean {
    return this.cluster.status.phase === 'Running';
  }

  public isLoaded(): boolean {
    if (this.cluster && getProvider(this.cluster) === NodeProvider.BRINGYOUROWN) {
      return true;
    } else if (this.cluster) {
      return !!this.nodeDc;
    }
  }
}
