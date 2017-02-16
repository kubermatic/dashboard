import {Component, OnInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {ApiService} from "../api/api.service";
import {ClusterModel} from "../api/model/ClusterModel";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {environment} from "../../environments/environment";

@Component({
  selector: "kubermatic-cluster",
  templateUrl: "./cluster.component.html",
  styleUrls: ["./cluster.component.scss"]
})
export class ClusterComponent implements OnInit {

  private restRoot: string = environment.restRoot;
  public clusterModel: ClusterModel;
  public nodes: any;
  public cluster: any;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private store: Store<fromRoot.State>) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.clusterModel = new ClusterModel(params["seedDcName"], params["clusterName"]);
      this.updateCluster();
      this.updateNodes();
    });
  }

  updateCluster(): void {
    this.api.getCluster(this.clusterModel).subscribe(result => {
      this.cluster = result;
    });
  }

  deleteCluster(){
    this.api.deleteCluster(this.clusterModel).subscribe(result => {
      this.cluster = result;
      this.router.navigate(['/clusters']);
    })
  }

  updateNodes(): void {
    this.api.getClusterNodes(this.clusterModel).subscribe(result => {
      this.nodes = result;
    });
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem("id_token");
    return `${this.restRoot}/dc/${this.clusterModel.dc}/cluster/${this.clusterModel.cluster}/kubeconfig?token=${authorization_token}`;
  }

  public addNodes(): void {
    // this.api.createClusterNode(clusterModel, /*  node  */);
  }

  public deleteNodes(): void {
    console.log('delete node');
  }
}

