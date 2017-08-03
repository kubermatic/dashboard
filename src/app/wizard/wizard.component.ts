import {Component, OnInit} from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {ClusterNameGenerator} from "../util/name-generator.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {NodeProvider, NodeInstanceFlavors} from "../api/model/NodeProviderConstants";
import {CreateClusterModel, CloudModel, ClusterSpec} from "../api/model/CreateClusterModel";
import {SshKeys} from "../api/model/SshKeysModel";

import {CreateNodeModel} from "../api/model/CreateNodeModel";
import {ClusterModel} from "../api/model/ClusterModel";

import {Router} from "@angular/router";
import {NotificationComponent} from "../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Observable, Subscription} from "rxjs";

import {MdDialog} from '@angular/material';

@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})
export class WizardComponent implements OnInit {

  public supportedNodeProviders: string[] = [NodeProvider.AWS, NodeProvider.DIGITALOCEAN, NodeProvider.BRINGYOUROWN, NodeProvider.BAREMETAL, NodeProvider.OPENSTACK];
  public groupedDatacenters: {[key: string]: DataCenterEntity[]} = {};

  public currentStep: number = 0;
  public stepsTitles: string[] = ["Data center", "Cloud provider", "Configuration", "Go!"];

  public selectedCloud: string = NodeProvider.AWS;
  public selectedCloudRegion: DataCenterEntity;
  public selectedCloudProviderApiError: string;
  public acceptBringYourOwn: boolean;

  public clusterNameForm: FormGroup;
  public awsForm: FormGroup;
  public digitalOceanForm: FormGroup;
  public bringYourOwnForm: FormGroup;
  public bareMetalForm: FormGroup;
  public openStackForm: FormGroup;

  public sshKeysFormField: SshKeys[] = [{
    aws :[],
    digitalocean : [],
    baremetal : [],
    openstack : []
  }];

  // Nodes Sizes
  public nodeSize: any[] = NodeInstanceFlavors.VOID;

  // Create Nodes
  public selectedNodeCountValue: number = 3;
  public cluster: any;
  public nodeSpec: any = {spec: {}};
  public clusterSpec: any = {};

  // Model add sshKey

  public config: any = {};
  public ssh_keys: string[] = [];

  constructor(private api: ApiService,
              private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder,
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


    this.clusterNameForm = this.formBuilder.group({
      name: [this.nameGenerator.generateName(),
        [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(50)]],
    });

    this.bringYourOwnForm = this.formBuilder.group({
      pif: ["", [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(16),
        Validators.pattern("[a-z0-9-]+(:[a-z0-9-]+)?")]],
    });

    this.awsForm = this.formBuilder.group({
      access_key_id: ["", [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secret_access_key: ["", [<any>Validators.required, <any>Validators.minLength(2)]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]],
      vpc_id: [""],
      subnet_id: [""],
      auto_update: [true, [<any>Validators.required]],
      disk_size: [8, [<any>Validators.required, CustomValidators.min(8), CustomValidators.max(200)]],
      container_linux_version: ['']
    });

    this.digitalOceanForm = this.formBuilder.group({
      access_token: ["", [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]]
    });

    this.bareMetalForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]]
    });

    this.openStackForm = this.formBuilder.group({
      os_project_name: ["", [<any>Validators.required]],
      os_username: ["", [<any>Validators.required]],
      os_password: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]]
    });
  }

  public selectCloud(cloud: string) {
    this.selectedCloud = cloud;
    this.selectedCloudRegion = null;

    if (cloud === NodeProvider.AWS) {
      this.nodeSize = NodeInstanceFlavors.AWS;
    }
  }

  public selectCloudRegion(cloud: DataCenterEntity) {
    this.selectedCloudRegion = cloud;
  }



  public getNodeCount(): string {
    if (this.selectedCloud === NodeProvider.AWS) {
      return this.awsForm.controls["node_count"].value;
    } else if (this.selectedCloud === NodeProvider.DIGITALOCEAN) {
      return this.digitalOceanForm.controls["node_count"].value;
    } else if (this.selectedCloud === NodeProvider.BAREMETAL) {
      return this.bareMetalForm.controls["node_count"].value;
    } else if (this.selectedCloud === NodeProvider.OPENSTACK) {
      return this.openStackForm.controls["node_count"].value;
    } else {
      return "-1";
    }
  }

  public getNodeSize(): string {
    if (this.selectedCloud === NodeProvider.AWS) {
      return this.awsForm.controls["node_size"].value;
    }

    if (this.selectedCloud === NodeProvider.DIGITALOCEAN ) {
      return this.digitalOceanForm.controls["node_size"].value;
    }

    if (this.selectedCloud === NodeProvider.OPENSTACK ) {
      return this.openStackForm.controls["node_size"].value;
    }


    return "";
  }

  public changeOpKey() {

    let region = this.selectedCloudRegion.spec.location;
    let project = this.openStackForm.controls["os_project_name"];
    let username = this.openStackForm.controls["os_username"];
    let password = this.openStackForm.controls["os_password"];
    let url = 'http://192.168.99.99/';

    if (project.valid && username.valid && password.valid) {
      let openStackImages = this.api.getOpenStackImages(region, project.value, username.value, password.value, url);
      console.log(openStackImages);
      //this.nodeSize = openStackImages;
    }
  }

  public changeDoKey() {
    let key = this.digitalOceanForm.controls["access_token"].value;

    this.api.getDigitaloceanSizes(key).subscribe(result => {
        this.nodeSize = result.sizes;
      }
    );
  }

  public refreshName() {
    this.clusterNameForm.patchValue({name: this.nameGenerator.generateName()});
  }

  public gotoStep(step: number) {
    this.currentStep = step;
  }

  public canGotoStep(step: number) {
    switch (step) {
      case 0:
        return this.clusterNameForm.valid;
      case 1:
        return !!this.selectedCloud;
      case 2:
        if (this.selectedCloud === NodeProvider.BRINGYOUROWN) {
          return this.acceptBringYourOwn;
        } else {
          return !!this.selectedCloudRegion;
        }
      case 3:

          if(!this.sshKeysFormField[0][this.selectedCloud].length) {
            return false;
          } else if (this.selectedCloud === NodeProvider.BRINGYOUROWN) {
            return this.bringYourOwnForm.valid;
          } else if (this.selectedCloud === NodeProvider.AWS) {
            return this.awsForm.valid;
          } else if (this.selectedCloud === NodeProvider.DIGITALOCEAN) {
            return this.digitalOceanForm.valid;
          } else if (this.selectedCloud === NodeProvider.BAREMETAL) {
            return this.bareMetalForm.valid;
          } else if (this.selectedCloud === NodeProvider.OPENSTACK) {
            return this.openStackForm.valid;
          } else {
            return false;
          }
      default:
        return false;
    }
  }

  public stepBack() {
    this.currentStep = (this.currentStep - 1) < 0 ? 0 : (this.currentStep - 1);
  }

  public stepForward() {
    this.currentStep = (this.currentStep + 1) > this.stepsTitles.length ? 0 : (this.currentStep + 1);
  }

  public canStepBack(): boolean {
    return this.currentStep > 0;
  }

  public canStepForward(): boolean {
    return this.canGotoStep(this.currentStep);
  }

  public createClusterAndNode() {
    let key = null;
    let secret =  null;
    let region = null;

    // Open Stack
    let os_project = null;
    let os_username = null;
    let os_password = null;

    if (this.selectedCloud !== NodeProvider.BRINGYOUROWN) {
      region = this.selectedCloudRegion.metadata.name;
    }

    let sub: Subscription;
    const timer = Observable.timer(0,10000);
    let node_instances: number = 3;

    this.ssh_keys = this.sshKeysFormField[0][this.selectedCloud];

    if (this.selectedCloud === NodeProvider.AWS) {

      key = this.awsForm.controls["access_key_id"].value;
      secret = this.awsForm.controls["secret_access_key"].value;

      node_instances = this.awsForm.controls["node_count"].value;

      this.clusterSpec.aws = {
        vpc_id: this.awsForm.controls["vpc_id"].value,
        subnet_id: this.awsForm.controls["subnet_id"].value,
        container_linux : {
          auto_update : this.awsForm.controls["auto_update"].value
        }
      }

      this.nodeSpec.spec = {
        dc: region,
        aws:  {
          type: this.awsForm.controls["node_size"].value,
          disk_size: this.awsForm.controls["disk_size"].value,
          container_linux: {
            version: this.awsForm.controls["container_linux_version"].value
          }
        }
      }

    }

    if (this.selectedCloud === NodeProvider.DIGITALOCEAN) {
      secret = this.digitalOceanForm.controls["access_token"].value;
      node_instances = this.digitalOceanForm.controls["node_count"].value;
      this.clusterSpec.digitalocean = {}

      this.nodeSpec.spec = {
        dc:  region,
        digitalocean: {
          size: this.digitalOceanForm.controls["node_size"].value,
          sshKeys: this.ssh_keys
        }
      }
    }

    if (this.selectedCloud === NodeProvider.BRINGYOUROWN) {
      this.clusterSpec.bringyourown = {
        privateInterface: this.bringYourOwnForm.controls["pif"].value
      }
    }

    if (this.selectedCloud === NodeProvider.BAREMETAL) {
      node_instances = this.bareMetalForm.controls["node_count"].value;

      this.clusterSpec.baremetal = {}

      this.nodeSpec.spec = {
        dc: region,
        baremetal: {}
      }
    }

    if (this.selectedCloud === NodeProvider.OPENSTACK) {
      os_project = this.openStackForm.controls["os_project"].value;
      os_username = this.awsForm.controls["os_username"].value;
      os_password = this.awsForm.controls["os_password"].value;

      node_instances = this.openStackForm.controls["node_count"].value;

      this.clusterSpec.openstack = {}

      this.nodeSpec.spec = {
        dc: region,
        openstack: {
          size: this.openStackForm.controls["node_size"].value,
        }
      }
    }

    const spec = new ClusterSpec(this.clusterNameForm.controls["name"].value, this.clusterSpec);

    const cloud = new CloudModel(key, secret, this.selectedCloud, region);

    const model = new CreateClusterModel(cloud, spec, this.ssh_keys);


    console.log("Create cluster mode: \n" + JSON.stringify(model));
    this.api.createCluster(model).subscribe(result => {

        NotificationComponent.success(this.store, "Success", `Cluster successfully created`);
        this.cluster = result;
        let redirectUrl = "/dc/" + this.cluster.seed + "/cluster/" + this.cluster.metadata.name ;
        this.router.navigate([redirectUrl]);

        if (this.selectedCloud == NodeProvider.BRINGYOUROWN) {
          return;
        }

        const clusterModel = new ClusterModel(this.cluster.seed, this.cluster.metadata.name);
        const createNodeModel = new CreateNodeModel(node_instances, this.nodeSpec.spec);
        sub = timer.subscribe(() => {
          this.api.getCluster(clusterModel).subscribe(result => {
              NotificationComponent.success(this.store, "Success", `Waiting till Cluster is running`);
              this.cluster = result;

              if (this.cluster.status.phase == "Running") {
                sub.unsubscribe();
                this.api.createClusterNode(clusterModel, createNodeModel).subscribe(result => {
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
