import {Component, OnInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {ApiService} from "../api/api.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {environment} from "../../environments/environment";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from '@angular/material';
import {ClusterDeleteConfirmationComponent} from "./cluster-delete-confirmation/cluster-delete-confirmation.component";
import {NodeEntity} from "../api/entitiy/NodeEntity";
import {ClusterEntity} from "../api/entitiy/ClusterEntity";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {AWSAddNodeFormComponent} from "../forms/add-node/aws/aws-add-node.component";
import {DigitaloceanAddNodeComponent} from "../forms/add-node/digitalocean/digitalocean-add-node.component";
import {OpenstackAddNodeComponent} from "../forms/add-node/openstack/openstack-add-node.component";
import {NotificationComponent} from "../notification/notification.component";
import {NodeProvider} from "../api/model/NodeProviderConstants";
import {AddNodeModalData} from "../forms/add-node/add-node-modal-data";
import {UpgradeClusterComponent} from './upgrade-cluster/upgrade-cluster.component';
import { CustomEventService, CreateNodesService, DatacenterService } from '../core/services';
import 'rxjs/add/operator/retry';
import {SSHKeyEntity} from "../api/entitiy/SSHKeyEntity";
import {UpgradeClusterComponentData} from "../api/model/UpgradeClusterDialogData";

@Component({
  selector: "kubermatic-cluster",
  templateUrl: "./cluster.component.html",
  styleUrls: ["./cluster.component.scss"],
  providers: [ApiService]
})
export class ClusterComponent implements OnInit {

  private restRoot: string = environment.restRoot;

  public nodes: NodeEntity[];
  public cluster: ClusterEntity;
  public seedDc: DataCenterEntity;
  public nodeDc: DataCenterEntity;
  public timer: any = Observable.timer(0,10000);
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
    private store: Store<fromRoot.State>,
    public dialog: MdDialog,
    private createNodesService: CreateNodesService,
    private dcService: DatacenterService
  ) {}

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.clusterName = params["clusterName"];
      this.sub = this.timer.subscribe(() => this.refreshData());
    });

    this.loadSshKeys();
    this.customEventService.subscribe('onNodeDelete', (nodeName: string) =>
      this.nodes = this.nodes.filter(node => node.metadata.name !== nodeName));
  }

  ngOnDestroy(){
    this.sub.unsubscribe();
  }

  loadUpgrades(): void {
    this.api.getClusterUpgrades(this.clusterName)
      .subscribe(upgrades => {
        this.upgradesList = upgrades;
        this.gotUpgradesList = true;
      });
  }

  loadDataCenter(dcName, dcObjectName):void {
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
          return false
        }
        return key.spec.clusters.indexOf(this.clusterName) > -1
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

          if(!this.seedDc) {
            this.loadDataCenter(this.cluster.status.seed, 'seedDc');
          }

          if(!this.nodeDc) {
            this.loadDataCenter(this.cluster.spec.cloud.dc, 'nodeDc');
          }

          if(this.cluster.isFailed() && this.createNodesService.hasData) {
            this.createNodesService.preventCreatingInitialClusterNodes();
          }

          if(this.cluster.isRunning()) {
            this.loadNodes();

            if(this.gotUpgradesList) return;

            this.loadUpgrades();
          }
        },
        error => {
          if(error.status === 404) {
            this.router.navigate(['404']);
          }
        }
      );
  }

  public addNode(): void {
    let data = new AddNodeModalData(this.cluster, this.nodeDc);
    if (this.cluster.provider == NodeProvider.AWS) {
      this.dialogRef = this.dialog.open(AWSAddNodeFormComponent, {data: data});
    } else if (this.cluster.provider == NodeProvider.DIGITALOCEAN) {
      this.dialogRef = this.dialog.open(DigitaloceanAddNodeComponent, {data: data});
    } else if (this.cluster.provider == NodeProvider.OPENSTACK) {
      this.dialogRef = this.dialog.open(OpenstackAddNodeComponent, {data: data});
    } else {
      NotificationComponent.error(this.store, "Error", `Add node form is missing.`);
      return;
    }

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

  public isLoaded() {
    return this.seedDc && this.nodeDc;
  }
}
