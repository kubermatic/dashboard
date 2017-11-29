import {Component, OnInit} from "@angular/core";
import {ApiService} from "app/core/services/api/api.service";
import {DataCenterEntity} from "../shared/entity/DatacenterEntity";
import {Router} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from "@angular/material";
import {CloudSpec} from "../shared/entity/ClusterEntity";
import {CreateClusterModel} from "../shared/model/CreateClusterModel";
import * as testing from "selenium-webdriver/testing";
import {CreateNodeModel} from "../shared/model/CreateNodeModel";
import {DigitaloceanCloudSpec} from "../shared/entity/cloud/DigitialoceanCloudSpec";
import {ClusterNameEntity} from "../shared/entity/wizard/ClusterNameEntity";
import {CustomEventService, CreateNodesService, InputValidationService, DatacenterService } from '../core/services';
import {NodeCreateSpec} from "../shared/entity/NodeEntity";
import {OpenstackNodeSpec} from "../shared/entity/node/OpenstackNodeSpec";
import {AWSNodeSpec} from "../shared/entity/node/AWSNodeSpec";
import {DigitaloceanNodeSpec} from "../shared/entity/node/DigitialoceanNodeSpec";
import {AWSCloudSpec} from "../shared/entity/cloud/AWSCloudSpec";
import {OpenstackCloudSpec} from "../shared/entity/cloud/OpenstackCloudSpec";
import { NotificationActions } from "app/redux/actions/notification.actions";
import { select } from "@angular-redux/store";

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

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;


  constructor(
    private api: ApiService,
    private router: Router,
    public dialog: MdDialog,
    private customEventService: CustomEventService,
    private createNodesService: CreateNodesService,
    public inputValidationService: InputValidationService,
    public dcService: DatacenterService
  ) {}


  ngOnInit() {
    this.resetCachedCredentials();
    this.dcService.getDataCenters().subscribe(result => {
      result.forEach(elem => {
        if (!elem.seed) {
          if (!this.groupedDatacenters.hasOwnProperty(elem.spec.provider)) {
            this.groupedDatacenters[elem.spec.provider] = [];
          }

          this.groupedDatacenters[elem.spec.provider].push(elem);
        }
      });
    });

    this.step$.subscribe(step => {
      this.step = step;
    });
  }


  public resetCachedCredentials() {
    this.cacheCloud =  new CloudSpec(
      '', 
      new DigitaloceanCloudSpec(''), 
      new AWSCloudSpec('', '', '', '', '', ''), 
      null, 
      new OpenstackCloudSpec('', '', '', 'Default', '', '', ''), 
      null
    );

    this.cacheNode = new CreateNodeModel(
      3, 
      new NodeCreateSpec(
        new DigitaloceanNodeSpec(''),
        new AWSNodeSpec('t2.medium', 20, '', ''),
        new OpenstackNodeSpec('m1.medium', ''), null)
    );
  }

  public setClusterName(clusterNameChangeEvent: ClusterNameEntity) {
    this.clusterName = clusterNameChangeEvent;
  }

  public setProvider(cloud: string) {
    if(this.selectedProvider != cloud){
      this.resetCachedCredentials();
      this.selectedProviderRegion = null;
    }

    this.selectedProvider = cloud;
    // this.gotoStep(2);
  }

  public setProviderRegion(cloud: DataCenterEntity) {
    this.selectedProviderRegion = cloud;
    // this.gotoStep(3);
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

  public createClusterAndNode() {

    console.log("Create cluster mode: \n" + JSON.stringify(this.createClusterModal));
    this.api.createCluster(this.createClusterModal).subscribe(cluster => {
        NotificationActions.success("Success", `Cluster successfully created`);
        this.router.navigate(["/clusters/" + cluster.metadata.name]);

        this.createNodesService.createInitialClusterNodes(cluster, this.createNodeModel);

      },
      error => {
        NotificationActions.error("Error", `${error.status} ${error.statusText}`);
      });
  }
}
