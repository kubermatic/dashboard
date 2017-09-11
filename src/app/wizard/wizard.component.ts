import {Component, OnInit} from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {NodeInstanceFlavors, NodeProvider} from "../api/model/NodeProviderConstants";
import {CreateNodeModel} from "../api/model/CreateNodeModel";
import {Router} from "@angular/router";
import {NotificationComponent} from "../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from "@angular/material";
import {AddSshKeyModalComponent} from "./add-ssh-key-modal/add-ssh-key-modal.component";
import {ClusterModel} from "../api/model/ClusterModel";
import {SshKeys} from "../api/model/SshKeysModel";
import {AWSCloudSpec} from "../api/entitiy/cloud/AWSCloudSpec";
import {AWSNodeSpec} from "../api/entitiy/node/AWSNodeSpec";
import {CloudSpec, ClusterEntity, ClusterSpec} from "../api/entitiy/ClusterEntity";
import {NodeCreateSpec} from "../api/entitiy/NodeEntity";
import {DigitaloceanNodeSpec} from "../api/entitiy/node/DigitialoceanNodeSpec";
import {BareMetalCloudSpec} from "../api/entitiy/cloud/BareMetalCloudSpec";
import {OpenstackCloudSpec} from "../api/entitiy/cloud/OpenstackCloudSpec";
import {OpenstackNodeSpec} from "../api/entitiy/node/OpenstackNodeSpec";
import {CreateClusterModel} from "../api/model/CreateClusterModel";
import {DigitaloceanCloudSpec} from "../api/entitiy/cloud/DigitialoceanCloudSpec";
import * as testing from "selenium-webdriver/testing";
import {ClusterNameEntity} from "../api/entitiy/wizard/ClusterNameEntity";


@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})
export class WizardComponent implements OnInit {

  public supportedNodeProviders: string[] = [NodeProvider.AWS, NodeProvider.DIGITALOCEAN, NodeProvider.BRINGYOUROWN, NodeProvider.BAREMETAL, NodeProvider.OPENSTACK];
  public groupedDatacenters: { [key: string]: DataCenterEntity[] } = {};

  public currentStep: number = 0;
  public stepFormard: boolean = false;

  public clusterName: ClusterNameEntity = {valid: false, value : ""};

  public selectedCloud: string = NodeProvider.AWS;
  public selectedCloudRegion: DataCenterEntity;
  public selectedCloudProviderApiError: string;
  public acceptBringYourOwn: boolean;


  public awsForm: FormGroup;
  public digitalOceanForm: FormGroup;
  public bringYourOwnForm: FormGroup;
  public bareMetalForm: FormGroup;
  public openStackForm: FormGroup;


  public clusterSpec: ClusterSpec;
  public nodeSpec: NodeCreateSpec;
  public node_instances: number = 3;

  public ssh_keys = [];


  public sshKeysFormField: SshKeys[] = [{
    aws :[],
    digitalocean : [],
    baremetal : [],
    openstack : []
  }];

  // Nodes Sizes
  public nodeSize: any[] =  NodeInstanceFlavors.AWS;

  // Create Nodes
  public cluster: any;

  // Model add sshKey
  public config: any = {};

  constructor(private api: ApiService,
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

    this.bringYourOwnForm = this.formBuilder.group({
      pif: ["", [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(16),
        Validators.pattern("[a-z0-9-]+(:[a-z0-9-]+)?")]],
    });

    this.awsForm = this.formBuilder.group({
      //Cluster spec
      access_key_id: ["", [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secret_access_key: ["", [<any>Validators.required, <any>Validators.minLength(2)]],
      vpc_id: [""],
      subnet_id: [""],
      route_table_id: [""],
      //Node spec
      node_count: [3, [<any>Validators.required, Validators.min(1)]],
      node_size: ["", [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [""],
      // Extend options
      aws_cas: [false],
      aws_nas: [false]
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
      os_tenant: ["", [<any>Validators.required]],
      os_domain: ["", [<any>Validators.required]],
      os_username: ["", [<any>Validators.required]],
      os_password: ["", [<any>Validators.required]],
      os_network: ["", [<any>Validators.required]],
      os_security_groups: ["", [<any>Validators.required]],
      os_floating_ip_pool: ["", [<any>Validators.required]],
      os_node_image: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]],
    });
  }

  public setClusterName(clusterNameChangeEvent: ClusterNameEntity) {
    this.clusterName = clusterNameChangeEvent;
  }


  public selectCloud(cloud: string) {
    debugger;
    this.selectedCloud = cloud;
    this.selectedCloudRegion = null;

    if (cloud === NodeProvider.AWS) {
      this.nodeSize = NodeInstanceFlavors.AWS;
    } else if (cloud == NodeProvider.OPENSTACK) {
      this.nodeSize = NodeInstanceFlavors.Openstack;
    }

    console.log(this.nodeSize)
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

    if (this.selectedCloud === NodeProvider.DIGITALOCEAN) {
      return this.digitalOceanForm.controls["node_size"].value;
    }

    if (this.selectedCloud === NodeProvider.OPENSTACK) {
      return this.openStackForm.controls["node_size"].value;
    }

    return "";
  }

  public changeOpKey() {

    let region = this.selectedCloudRegion.spec.location;
    let tenant = this.openStackForm.controls["os_tenant"];
    let username = this.openStackForm.controls["os_username"];
    let password = this.openStackForm.controls["os_password"];
    let url = 'http://192.168.99.99/';

    if (tenant.valid && username.valid && password.valid) {
      // let openStackImages = this.api.getOpenStackImages(region, tenant.value, username.value, password.value, url);
      // console.log(openStackImages);
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
          new AWSCloudSpec(
            this.awsForm.controls["access_key_id"].value,
            this.awsForm.controls["secret_access_key"].value,
            this.awsForm.controls["vpc_id"].value,
            this.awsForm.controls["subnet_id"].value,
            this.awsForm.controls["route_table_id"].value,
            "",
          ),
          null,
          null,
          null,
        ),
        this.clusterName.value,
        "",
      );

      this.nodeSpec = new NodeCreateSpec(
        null,
        new AWSNodeSpec(
          this.awsForm.controls["node_size"].value,
          this.awsForm.controls["root_size"].value,
          //Can we implement at some point
          // this.awsForm.controls["volume_type"].value,
          "gp2",
          this.awsForm.controls["ami"].value
        ),
        null,
        null,
      );

      this.node_instances = this.awsForm.controls["node_count"].value;
    } else if (this.selectedCloud === NodeProvider.DIGITALOCEAN) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.selectedCloudRegion.metadata.name,
          new DigitaloceanCloudSpec(this.digitalOceanForm.controls["access_token"].value),
          null,
          null,
          null,
          null,
        ),
        this.clusterName.value,
        "",
      );

      this.nodeSpec = new NodeCreateSpec(
        new DigitaloceanNodeSpec(this.digitalOceanForm.controls["node_size"].value),
        null,
        null,
        null,
      );
      this.node_instances = this.digitalOceanForm.controls["node_count"].value;
    } else if (this.selectedCloud === NodeProvider.BAREMETAL) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.selectedCloudRegion.metadata.name,
          null,
          null,
          null,
          null,
          new BareMetalCloudSpec(""),
        ),
        this.clusterName.value,
        "",
      );

      this.nodeSpec = new NodeCreateSpec(
        null,
        null,
        null,
        null,
      );
      this.node_instances = this.bareMetalForm.controls["node_count"].value;
    } else if (this.selectedCloud === NodeProvider.OPENSTACK) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.selectedCloudRegion.metadata.name,
          null,
          null,
          null,
          new OpenstackCloudSpec(
            this.openStackForm.controls["os_username"].value,
            this.openStackForm.controls["os_password"].value,
            this.openStackForm.controls["os_tenant"].value,
            this.openStackForm.controls["os_domain"].value,
            this.openStackForm.controls["os_network"].value,
            this.openStackForm.controls["os_security_groups"].value,
            this.openStackForm.controls["os_floating_ip_pool"].value,
          ),
          null,
        ),
        this.clusterName.value,
        "",
      );

      this.nodeSpec = new NodeCreateSpec(
        null,
        null,
        new OpenstackNodeSpec(
          this.openStackForm.controls["node_size"].value,
          this.openStackForm.controls["os_node_image"].value
        ),
        null,
      );
      this.node_instances = this.openStackForm.controls["node_count"].value;
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

        if (this.selectedCloud == NodeProvider.BRINGYOUROWN) {
          return;
        }

        const createNodeModel = new CreateNodeModel(this.node_instances, this.nodeSpec);
        sub = timer.subscribe(() => {
          this.api.getCluster(new ClusterModel(cluster.seed, cluster.metadata.name)).subscribe(cluster => {
              if (cluster.status.phase == "Running") {
                sub.unsubscribe();
                this.api.createClusterNode(cluster, createNodeModel).subscribe(result => {
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
