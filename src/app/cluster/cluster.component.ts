import { AddNodeModalComponent } from './add-node-modal/add-node-modal.component';
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "app/core/services/api/api.service";
import { environment } from "../../environments/environment";
import { Observable, Subscription } from "rxjs";
import { MdDialog } from '@angular/material';
import { ClusterDeleteConfirmationComponent } from "./cluster-delete-confirmation/cluster-delete-confirmation.component";
import { NodeEntity } from "../shared/entity/NodeEntity";
import { ClusterEntity } from "../shared/entity/ClusterEntity";
import { DataCenterEntity } from "../shared/entity/DatacenterEntity";
import { NodeProvider } from "../shared/model/NodeProviderConstants";
import { AddNodeModalData } from "../shared/model/add-node-modal-data";
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import { CustomEventService, CreateNodesService, DatacenterService } from '../core/services';
import 'rxjs/add/operator/retry';
import { SSHKeyEntity } from "../shared/entity/SSHKeyEntity";
import { UpgradeClusterComponentData } from "../shared/model/UpgradeClusterDialogData";

@Component({
  selector: "kubermatic-cluster",
  templateUrl: "./cluster.component.html",
  styleUrls: ["./cluster.component.scss"],
  providers: [ApiService]
})
export class ClusterComponent implements OnInit, OnDestroy {

  private restRoot: string = environment.restRoot;

  public nodes: NodeEntity[];
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

  constructor(
    private customEventService: CustomEventService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public dialog: MdDialog,
    private createNodesService: CreateNodesService,
    private dcService: DatacenterService
  ) {}

  public ngOnInit(): void {

    this.route.params.subscribe(params => {
      this.clusterName = params["clusterName"];
      this.sub = this.timer.subscribe(() => this.refreshData());
    });

    this.loadSshKeys();
    this.customEventService.subscribe('onNodeDelete', (nodeName: string) =>
      this.nodes = this.nodes.filter(node => node.metadata.name !== nodeName));
  }

  public ngOnDestroy(): void {
    this.sub.unsubscribe();
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
    let data = new AddNodeModalData(this.cluster, this.nodeDc);

    this.dialogRef = this.dialog.open(AddNodeModalComponent, { data });

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public deleteClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterDeleteConfirmationComponent, this.config);

    this.dialogRef.componentInstance.humanReadableName = this.cluster.spec.humanReadableName;
    this.dialogRef.componentInstance.clusterName = this.clusterName;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public upgradeClusterDialog(): void {
    let dialogWidth = '500px';

    this.dialogRef = this.dialog.open(UpgradeClusterComponent, {
      data: new UpgradeClusterComponentData(this.clusterName, this.upgradesList),
      width: dialogWidth
    });
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem("token");
    return `${this.restRoot}/cluster/${this.clusterName}/kubeconfig?token=${authorization_token}`;
  }

  public isLoaded(): boolean {
    if (this.cluster && this.cluster.provider === NodeProvider.BRINGYOUROWN) {
      return !!this.seedDc;
    } else if (this.cluster) {
      return !!this.seedDc && !!this.nodeDc;
    }
  }
}
