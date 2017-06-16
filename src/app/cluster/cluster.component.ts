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


  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private store: Store<fromRoot.State>, public dialog: MdDialog) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.clusterModel = new ClusterModel(params["seedDcName"], params["clusterName"]);
      this.sub = this.timer.subscribe(() => {
        this.updateCluster();
        this.updateNodes();
      });
    });
  }

  ngOnDestroy(){
    this.sub.unsubscribe();
  }

  updateCluster(): void {
    this.api.getClusterWithDatacenter(this.clusterModel).subscribe(result => {
      this.cluster = result;
    });
  }

  updateNodes(): void {
    this.api.getClusterNodes(this.clusterModel).subscribe(result => {
      this.nodes = result;
    });
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

