import {Component, OnInit} from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {Router} from "@angular/router";
import {NotificationComponent} from "../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from "@angular/material";
import {CloudSpec} from "../api/entitiy/ClusterEntity";
import {CreateClusterModel} from "../api/model/CreateClusterModel";
import * as testing from "selenium-webdriver/testing";
import {CreateNodeModel} from "../api/model/CreateNodeModel"
import {DigitaloceanCloudSpec} from "../api/entitiy/cloud/DigitialoceanCloudSpec";
import {ClusterNameEntity} from "../api/entitiy/wizard/ClusterNameEntity";
import {CustomEventService, CreateNodesService, InputValidationService} from '../services';
import {NodeCreateSpec} from "../api/entitiy/NodeEntity";
import {OpenstackNodeSpec} from "../api/entitiy/node/OpenstackNodeSpec";
import {AWSNodeSpec} from "../api/entitiy/node/AWSNodeSpec";
import {DigitaloceanNodeSpec} from "../api/entitiy/node/DigitialoceanNodeSpec";
import {AWSCloudSpec} from "../api/entitiy/cloud/AWSCloudSpec";
import {OpenstackCloudSpec} from "../api/entitiy/cloud/OpenstackCloudSpec";

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

  //Validation: Cluster
  public clusterModalValid: boolean = false;

  //Validation: Node
  public nodeModalValid: boolean = false;

  public groupedDatacenters: { [key: string]: DataCenterEntity[] } = {};

  public cacheCloud: CloudSpec;
  public cacheNode: CreateNodeModel;


  constructor(
    private api: ApiService,
    private router: Router,
    private store: Store<fromRoot.State>,
    public dialog: MdDialog,
    private customEventService: CustomEventService,
    private createNodesService: CreateNodesService,
    public inputValidationService: InputValidationService
  ) {}


  ngOnInit() {
    this.resetCachedCredentials();
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

  public resetCachedCredentials() {
    this.cacheCloud =  new CloudSpec('', new DigitaloceanCloudSpec(''), new AWSCloudSpec('','','','','',''), null, new OpenstackCloudSpec('','','','','','',''), null);
    this.cacheNode = new CreateNodeModel(3, new NodeCreateSpec(new DigitaloceanNodeSpec(''), new AWSNodeSpec('',20,'',''), new OpenstackNodeSpec('',''), null,));
  }

  public setClusterName(clusterNameChangeEvent: ClusterNameEntity) {
    this.clusterName = clusterNameChangeEvent;
  }

  public setProvider(cloud: string) {
    if(this.selectedProvider != cloud){
      this.resetCachedCredentials();
    }

    this.selectedProvider = cloud;
    this.selectedProviderRegion = null;
  }

  public setProviderRegion(cloud: DataCenterEntity) {
    this.selectedProviderRegion = cloud;
  }

  public setCluster(cluster) {
    this.createClusterModal = cluster;
  }

  public setCloud(cloud) {
    this.cacheCloud = cloud;
  }

  public setNode(node) {
    this.createNodeModel = node;
    this.cacheNode = node;
  }

  public setSshKeys(keys) {
    this.selectedSshKeys = keys;
  }

  public checkCloudValid(value){
    this.clusterModalValid = value;
  }

  public checkNodeValid(value){
    this.nodeModalValid = value;
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
          if(!this.selectedSshKeys) {
            return false;
          } else if (this.clusterModalValid && this.nodeModalValid){
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
        this.router.navigate(["/cluster/" + cluster.metadata.name]);

        this.createNodesService.createInitialClusterNodes(cluster, this.createNodeModel);

      },
      error => {
        NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);

      });
  }
}
