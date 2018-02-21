import { AddNodeModalComponent } from './add-node-modal/add-node-modal.component';
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'app/core/services/api/api.service';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog } from '@angular/material';
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import { NodeEntityV2 } from 'app/shared/entity/NodeEntity';
import { ClusterEntity } from 'app/shared/entity/ClusterEntity';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { NodeProvider } from 'app/shared/model/NodeProviderConstants';
import { AddNodeModalData } from 'app/shared/model/add-node-modal-data';
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import { CustomEventService, CreateNodesService, DatacenterService } from 'app/core/services';
import 'rxjs/add/operator/retry';

import { SSHKeyEntity } from 'app/shared/entity/SSHKeyEntity';
import { UpgradeClusterComponentData } from 'app/shared/model/UpgradeClusterDialogData';
import {ClusterConnectComponent} from './cluster-connect/cluster-connect.component';

@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.scss']
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {

  public nodes: NodeEntityV2[];
  public cluster: ClusterEntity;
  public seedDc: DataCenterEntity;
  public nodeDc: DataCenterEntity;
  public timer: any = Observable.timer(0, 10000);
  public sub: Subscription;
  public dialogRef: any;
  public config: any = {};
  public clusterName: string;
  public loading: boolean = true;
  public sshKeys: SSHKeyEntity[] = [];
  private upgradesList: string[] = [];
  private gotUpgradesList: boolean;
  public groupedNodes: object[];
  public stateOfTheAccordion: object[];
  public moreSshKeys: boolean = false;

  constructor(
    private customEventService: CustomEventService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public dialog: MatDialog,
    private createNodesService: CreateNodesService,
    private dcService: DatacenterService
  ) {}

  public ngOnInit(): void {
    this.clusterName = this.route.snapshot.paramMap.get('clusterName');
    this.sub = this.timer.subscribe(() => {
      this.refreshData();
    });

    this.loadSshKeys();
    this.customEventService.subscribe('onNodeDelete', (nodeName: string) =>
      this.nodes = this.nodes.filter(node => node.metadata.name !== nodeName));
  }

  public ngOnDestroy(): void {
    this.sub && this.sub.unsubscribe();
  }

  loadUpgrades(): void {
    this.api.getClusterUpgrades(this.clusterName)
      .subscribe(upgrades => {
        this.upgradesList = upgrades;
        this.gotUpgradesList = true;
      });
  }

  loadDataCenter(dcName, dcObjectName): void {
    this.dcService.getDataCenter(dcName).subscribe(res =>
      this[dcObjectName] = new DataCenterEntity(res.metadata, res.spec, res.seed));
  }

  loadCluster(): Observable<ClusterEntity> {
    return this.api.getCluster(this.clusterName)
      .retry(3);
  }

  loadSshKeys(): void {
    this.api.getSSHKeys().subscribe(keys => {
      this.sshKeys = keys.filter(key => {
        if (key.spec.clusters == null) {
          return false;
        }
        return key.spec.clusters.indexOf(this.clusterName) > -1;
      });
    });
  }

  loadMoreSshKeys(moreSshKeys: boolean) {
    this.moreSshKeys = moreSshKeys;
  }

  loadNodes(): void {
    this.api.getClusterNodes(this.clusterName).subscribe(nodes => {
      this.nodes = nodes;
    });
  }

  refreshData(): void {
    this.loadCluster()
      .subscribe(
        res => {
          this.cluster = new ClusterEntity(
            res.metadata,
            res.spec,
            res.address,
            res.status,
          );

          if (!this.seedDc) {
            this.loadDataCenter(this.cluster.spec.seedDatacenterName, 'seedDc');
          }

          if (!this.nodeDc && this.cluster.provider !== NodeProvider.BRINGYOUROWN) {
            this.loadDataCenter(this.cluster.spec.cloud.dc, 'nodeDc');
          }

          if (this.cluster.isFailed() && this.createNodesService.hasData) {
            this.createNodesService.preventCreatingInitialClusterNodes();
          }

          if (this.cluster.isRunning()) {
            this.loadNodes();

            if (this.gotUpgradesList) {
              return;
            }

            this.loadUpgrades();
          }
        },
        error => {
          if (error.status === 404) {
            this.router.navigate(['404']);
          }
        }
      );
  }

  public addNode(): void {
    const data = new AddNodeModalData(this.cluster, this.nodeDc);

    this.dialogRef = this.dialog.open(AddNodeModalComponent, { data });

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public deleteClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterDeleteConfirmationComponent, this.config);

    this.dialogRef.componentInstance.humanReadableName = this.cluster.spec.humanReadableName;
    this.dialogRef.componentInstance.clusterName = this.clusterName;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public connectClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterConnectComponent, this.config);
    this.dialogRef.componentInstance.clusterName = this.clusterName;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public upgradeClusterDialog(): void {
    const dialogWidth = '500px';

    this.dialogRef = this.dialog.open(UpgradeClusterComponent, {
      data: new UpgradeClusterComponentData(this.clusterName, this.upgradesList),
      width: dialogWidth
    }).afterClosed().subscribe(() => {
      this.gotUpgradesList = false;
      this.loadUpgrades();
    });
  }

  public isLoaded(): boolean {
    if (this.cluster && this.cluster.provider === NodeProvider.BRINGYOUROWN) {
      return !!this.seedDc;
    } else if (this.cluster) {
      return !!this.seedDc && !!this.nodeDc;
    }
  }
}
