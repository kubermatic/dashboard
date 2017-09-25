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
import {CreateNodeModel} from "../api/model/CreateNodeModel";


@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})

export class WizardComponent implements OnInit {

  // Current Create Cluster Step
  public currentStep: number = 0;

  // Step 1: Cluster Name
  public clusterName: ClusterNameEntity = {valid: false, value : ""};

  // Step 2: Selected Provider
  public selectedProvider: string;

  // Step 3: Selected Provider Region
  public selectedProviderRegion: DataCenterEntity;

  // step 5: get sshKeys for Summary
  public selectedSshKeys: string[] = [];

  // Step 5: get Cluster Modal
  public createClusterModal: CreateClusterModel;

  // step 5: get Node Modal for Summary
  public createNodeModel: CreateNodeModel;

  public groupedDatacenters: { [key: string]: DataCenterEntity[] } = {};

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

  public setProvider(cloud: string) {
    this.selectedProvider = cloud;
    this.selectedProviderRegion = null;
  }

  public setProviderRegion(cloud: DataCenterEntity) {
    this.selectedProviderRegion = cloud;
  }

  public setCluster(cluster) {
    this.createClusterModal = cluster;
  }

  public setNode(node) {
    this.createNodeModel = node;
  }

  public setSshKeys(keys) {
    this.selectedSshKeys = keys;
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
        return !!this.selectedProvider;
      case 2:
        return !!this.selectedProviderRegion;
      case 3:
          if(!this.selectedSshKeys.length) {
            return false;
          } else if (this.createClusterModal && this.createNodeModel){
            return true;
          } else {
            return false;
          }
      case 4:
        return true;
      default:
        return false;
    }
  }

  public canStepForward(): boolean {
    return this.canGotoStep(this.currentStep);
  }

  public createClusterAndNode() {
    let sub: Subscription;
    const timer = Observable.timer(0, 10000);

    console.log("Create cluster mode: \n" + JSON.stringify(this.createClusterModal));
    this.api.createCluster(this.createClusterModal).subscribe(cluster => {
        NotificationComponent.success(this.store, "Success", `Cluster successfully created`);
        this.router.navigate(["/dc/" + cluster.seed + "/cluster/" + cluster.metadata.name]);

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
