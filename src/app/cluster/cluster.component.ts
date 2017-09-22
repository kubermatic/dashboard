import {Component, OnInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {ApiService} from "../api/api.service";
import {ClusterModel} from "../api/model/ClusterModel";
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
import {CustomEventService} from '../services';
import 'rxjs/add/operator/retry';

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
  public dc: DataCenterEntity;
  public timer: any = Observable.timer(0,10000);
  public sub: Subscription;
  public dialogRef: any;
  public config: any = {};
  public clusterName: string;
  public seedDcName: string;
  public nodeSizes: any = [];
  public loading: boolean = true;
  public sshKeysNames: string[] = [];
  public dcLocation: string = "";
  public dcFlagCode: string = "";
  private upgradesList: string[] = [];

  constructor(
    private customEventService: CustomEventService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private store: Store<fromRoot.State>,
    public dialog: MdDialog
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.clusterName = params["clusterName"];
      this.seedDcName = params["seedDcName"];

      this.sub = this.timer.subscribe(() => {
        this.update();
      });
    });

    this.api.getSSHKeys().subscribe(keys => {
      this.sshKeysNames = keys.filter(key => {
        if(key['clusters']) {
          return key['clusters'].includes(this.clusterName);
        }
      }).map(key => key.name);
    });

    this.api.getDataCenter(this.seedDcName).subscribe(dc => {
      this.dcLocation = dc.spec.country + ' / ' + dc.spec.location;
      this.dcFlagCode = dc.spec.country.toLowerCase();
    })
    this.customEventService.subscribe('onNodeDelete', (nodeName: string) =>
      this.nodes = this.nodes.filter(node => node.metadata.name !== nodeName));
  }

  ngOnDestroy(){
    this.sub.unsubscribe();
  }

  update(): void {
    this.api.getCluster(new ClusterModel(this.seedDcName, this.clusterName))
    .retry(3)
    .subscribe(res => {
      this.cluster = new ClusterEntity(
        res.metadata,
        res.spec,
        res.address,
        res.status,
        res.seed,
      );
      this.api.getDataCenter(this.cluster.spec.cloud.dc).subscribe(res => {
        this.dc = new DataCenterEntity(res.metadata, res.spec, res.seed);
        this.loading = false;
      });
      
      if (this.cluster.isRunning()) {
        this.updateNodes();

        this.api.getClusterUpgrades(new ClusterModel(this.seedDcName, this.clusterName))
          .subscribe(upgrades => this.upgradesList = upgrades);
      }
    },
      error => NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`));
  }

  updateNodes(): void {
    this.api.getClusterNodes(new ClusterModel(this.seedDcName, this.clusterName)).subscribe(nodes => {
      this.nodes = nodes;
    });
  }

  public addNode(): void {
    let data = new AddNodeModalData(this.cluster, this.dc);
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
    this.dialogRef.componentInstance.seedDcName = this.seedDcName;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public upgradeClusterDialog(): void {
    let dialogWidth = '500px';
    this.dialogRef = this.dialog.open(UpgradeClusterComponent, {
      data: {
        upgradesList: this.upgradesList,
        clusterModel: new ClusterModel(this.seedDcName, this.clusterName)
      },
      width: dialogWidth
    });
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem("token");
    return `${this.restRoot}/dc/${this.seedDcName}/cluster/${this.clusterName}/kubeconfig?token=${authorization_token}`;
  }
}

