import {Component, OnInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {ApiService} from "../api/api.service";
import {ClusterModel} from "../api/model/ClusterModel";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {environment} from "../../environments/environment";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from '@angular/material';
import {ClusterDeleteConfirmationComponent} from "../cluster/cluster-delete-confirmation/cluster-delete-confirmation.component";
import {AddNodeComponent} from "../cluster/add-node/add-node.component"
import {NodeInstanceFlavors} from "../api/model/NodeProviderConstants";

@Component({
  selector: "kubermatic-cluster",
  templateUrl: "./cluster.component.html",
  styleUrls: ["./cluster.component.scss"],
  providers: [ApiService]
})
export class ClusterComponent implements OnInit {

  private restRoot: string = environment.restRoot;
  public clusterModel: ClusterModel;
  public nodes: any;
  public cluster;
  public timer: any = Observable.timer(0,10000);
  public sub: Subscription;

  public dialogRef: any;
  public config: any = {};

  public clusterName: string;
  public seedDcName: string;

  public nodeSizes: any = [];


  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private store: Store<fromRoot.State>, public dialog: MdDialog) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.clusterModel = new ClusterModel(params["seedDcName"], params["clusterName"]);
      this.sub = this.timer.subscribe(() => {
        this.updateCluster();

        if (!!this.cluster && this.cluster.status.phase == "Running") {
          this.updateNodes();
        }
      });
    });
  }

  public getProviderNodeSpecification() {
    switch (this.cluster.dc.spec.provider) {
      case 'aws' : {
        this.nodeSizes = NodeInstanceFlavors.AWS;
        return this.nodeSizes;
      }

      case 'digitalocean' : {
        this.api.getDigitaloceanSizes(this.cluster.spec.cloud.digitalocean.token).subscribe(result => {
            this.nodeSizes = result.sizes;
            return this.nodeSizes;
          }
        );
      }
      case 'openstack' : {
        //let openStackImages = this.api.getOpenStackImages('region', 'project', 'username', 'password', 'url');
        //console.log(openStackImages);
        //this.nodeSize = openStackImages;
      }
    }
  }

  ngOnDestroy(){
    this.sub.unsubscribe();
  }

  updateCluster(): void {
    this.api.getClusterWithDatacenter(this.clusterModel).subscribe(result => {
      this.cluster = result;
      this.getProviderNodeSpecification();
    });
  }

  updateNodes(): void {
    this.api.getClusterNodes(this.clusterModel).subscribe(result => {
      this.nodes = result;
    });
  }

  public addNode(): void {
    this.dialogRef = this.dialog.open(AddNodeComponent);
    this.dialogRef.componentInstance.clusterName = this.clusterModel.cluster;
    this.dialogRef.componentInstance.seedDcName = this.clusterModel.dc;
    this.dialogRef.componentInstance.cluster = this.cluster;
    this.dialogRef.componentInstance.nodeSize = this.nodeSizes;

    this.dialogRef.afterClosed().subscribe(result => {});
  }


  public deleteClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterDeleteConfirmationComponent, this.config);

    this.dialogRef.componentInstance.humanReadableName = this.cluster.spec.humanReadableName;
    this.dialogRef.componentInstance.clusterName = this.clusterModel.cluster;
    this.dialogRef.componentInstance.seedDcName = this.clusterModel.dc;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem("token");
    return `${this.restRoot}/dc/${this.clusterModel.dc}/cluster/${this.clusterModel.cluster}/kubeconfig?token=${authorization_token}`;
  }
}

