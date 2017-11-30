import {Component, OnInit, OnDestroy} from "@angular/core";
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
import { WizardActions } from "app/redux/actions/wizard.actions";

@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})

export class WizardComponent implements OnInit, OnDestroy {

  // step 5: get sshKeys for Summary
  public selectedSshKeys: string[] = [];
  
  // Step 5: get Cluster Modal
  public createClusterModal: CreateClusterModel;
  
  // step 5: get Node Modal for Summary
  public createNodeModel: CreateNodeModel;
    
  public cacheCloud: CloudSpec;
  public cacheNode: CreateNodeModel;
  
  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;
  
  @select(['wizard', 'setDatacenterForm', 'datacenter']) datacenter$: Observable<DataCenterEntity>;
  public selectedProviderRegion: DataCenterEntity;
  
  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string;

  constructor(
    private api: ApiService,
    private router: Router,
    public dialog: MdDialog,
    private customEventService: CustomEventService,
    private createNodesService: CreateNodesService,
    public inputValidationService: InputValidationService
  ) {}

  ngOnInit() {
    this.resetCachedCredentials();

    this.step$.combineLatest(this.datacenter$, this.provider$)
      .subscribe((data: [number, DataCenterEntity, string]) => {
        const step = data[0];
        const datacenter = data[1];
        const provider = data[2];

        this.step = step;
        if (step === 5) {
          this.createClusterAndNode();
        }

        datacenter && (this.selectedProviderRegion = datacenter);

        provider && this.setProvider(provider);
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

  public setProvider(cloud: string) {
    if (this.selectedProvider !== cloud) {
      this.resetCachedCredentials();
      this.selectedProviderRegion = null;
    }

    this.selectedProvider = cloud;
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

  public ngOnDestroy(): void {
    WizardActions.clearStore();
  }
}
