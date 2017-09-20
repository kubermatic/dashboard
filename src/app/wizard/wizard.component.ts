import {Component, OnInit} from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {NodeProvider} from "../api/model/NodeProviderConstants";
import {Router} from "@angular/router";
import {NotificationComponent} from "../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from "@angular/material";
import {ClusterModel} from "../api/model/ClusterModel";
import {SshKeys} from "../api/model/SshKeysModel";
import {CloudSpec, ClusterSpec} from "../api/entitiy/ClusterEntity";
import {CreateClusterModel} from "../api/model/CreateClusterModel";
import * as testing from "selenium-webdriver/testing";
import {ClusterNameEntity} from "../api/entitiy/wizard/ClusterNameEntity";


@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})

export class WizardComponent implements OnInit {

  public groupedDatacenters: { [key: string]: DataCenterEntity[] } = {};

  public currentStep: number = 0;

  public clusterName: ClusterNameEntity = {valid: false, value : ""};

  public selectedCloud: string;
  public selectedCloudRegion: DataCenterEntity;

  public clusterSpec: ClusterSpec;
  public ssh_keys = [];

  public getCloudSpec;
  public createNodeModel;

  public sshKeysFormField: SshKeys[] = [{
    aws :[],
    digitalocean : [],
    baremetal : [],
    openstack : []
  }];

  // Create Nodes
  public cluster: any;

  constructor(private api: ApiService,
              private router: Router,
              private store: Store<fromRoot.State>,
              public dialog: MdDialog) {
  }

  ngOnInit() {
    this.api.getDataCenters().subscribe(result => {
      result.forEach(elem => {
        if (!elem.seed) {
          if (!this.groupedDatacenters.hasOwnProperty(elem.spec.provider)) {
            this.groupedDatacenters[elem.spec.provider] = [];
          }

          this.groupedDatacenters[elem.spec.provider].push(elem);
        }
      });
    });
  }

  public setClusterName(clusterNameChangeEvent: ClusterNameEntity) {
    this.clusterName = clusterNameChangeEvent;
  }

  public setCloud(spec) {
    this.getCloudSpec = spec;
  }

  public setNode(model) {
    this.createNodeModel = model;
  }

  public selectCloud(cloud: string) {
    this.selectedCloud = cloud;
    this.selectedCloudRegion = null;
  }

  public selectCloudRegion(cloud: DataCenterEntity) {
    this.selectedCloudRegion = cloud;
  }

  public gotoStep(step: number) {
    switch (step) {
      case 5:
        this.createClusterAndNode();
        break;

      default:
        this.currentStep = step;
    }
  }

  public canGotoStep(step: number) {
    switch (step) {
      case 0:
        return this.clusterName.valid;
      case 1:
        return !!this.selectedCloud;
      case 2:
        return !!this.selectedCloudRegion;
      case 3:
          if(!this.sshKeysFormField[0][this.selectedCloud].length) {
            return false;
          } else if (this.getCloudSpec && this.createNodeModel){

            return true;
          } else {
            return false;
          }
      case 4:
        this.createSpec();
        return true;
      default:
        return false;
    }
  }

  public canStepForward(): boolean {
    return this.canGotoStep(this.currentStep);
  }


  public createSpec() {
    this.ssh_keys = this.sshKeysFormField[0][this.selectedCloud];

    if (this.selectedCloud === NodeProvider.AWS) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.selectedCloudRegion.metadata.name,
          null,
          this.getCloudSpec,
          null,
          null,
          null,
        ),
        this.clusterName.value,
        "",
      );

    } else if (this.selectedCloud === NodeProvider.DIGITALOCEAN) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.selectedCloudRegion.metadata.name,
          this.getCloudSpec,
          null,
          null,
          null,
          null,
        ),
        this.clusterName.value,
        "",
      );
    } else if (this.selectedCloud === NodeProvider.OPENSTACK) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.selectedCloudRegion.metadata.name,
          null,
          null,
          null,
          this.getCloudSpec,
          null,
        ),
        this.clusterName.value,
        "",
      );
    }
  }

  public createClusterAndNode() {

    let sub: Subscription;
    const timer = Observable.timer(0, 10000);

    let cluster = new CreateClusterModel(
      this.clusterSpec,
      this.ssh_keys,
    );

    console.log("Create cluster mode: \n" + JSON.stringify(cluster));
    this.api.createCluster(cluster).subscribe(cluster => {
        NotificationComponent.success(this.store, "Success", `Cluster successfully created`);
        this.router.navigate(["/dc/" + cluster.seed + "/cluster/" + cluster.metadata.name]);

        //this.createNodeModel = new CreateNodeModel(this.node_instances, this.nodeSpec);
        sub = timer.subscribe(() => {
          this.api.getCluster(new ClusterModel(cluster.seed, cluster.metadata.name)).subscribe(cluster => {
              if (cluster.status.phase == "Running") {
                sub.unsubscribe();

                this.api.createClusterNode(cluster, this.createNodeModel).subscribe(result => {
                    NotificationComponent.success(this.store, "Success", `Creating Nodes`);
                  },
                  error => {
                    NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);
                  });
              }
            },
            error => {
              sub.unsubscribe();
              NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);
            });
        })
      },
      error => {
        NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);
      });
  }
}
