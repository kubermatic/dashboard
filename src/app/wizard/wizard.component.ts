import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {ClusterNameGenerator} from "../util/name-generator.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {SSHKey} from "../api/model/SSHKeyModel";


@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})
export class WizardComponent implements OnInit {

  public supportedNodeProviders: string[] = ["aws", "digitalocean", "bringyourown"];
  public groupedDatacenters: {[key: string]: DataCenterEntity[]} = {};

  public currentStep: number = 0;
  public stepsTitles: string[] = ["Data center", "Cloud provider", "Configuration", "Go!"];

  public selectedCloud: string;
  public selectedCloudRegion: DataCenterEntity;
  public selectedCloudProviderApiError: string;
  public acceptBringYourOwn: boolean;

  public clusterNameForm: FormGroup;
  public awsForm: FormGroup;
  public digitalOceanForm: FormGroup;
  public bringYourOwnForm: FormGroup;

  public sshKeys: SSHKey[] = [];
  public nodeSize: string[] = [];

  constructor(private api: ApiService, private nameGenerator: ClusterNameGenerator, private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.api.getDataCenters().subscribe(result => {
      result.forEach(elem => {
        if (!this.groupedDatacenters.hasOwnProperty(elem.spec.provider)) {
          this.groupedDatacenters[elem.spec.provider] = [];
        }

        this.groupedDatacenters[elem.spec.provider].push(elem);
      });
      // console.log(JSON.stringify(this.seedDataCenters));
    });


    this.clusterNameForm = this.formBuilder.group({
      clustername: [this.nameGenerator.generateName(),
        [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(16)]],
    });

    this.bringYourOwnForm = this.formBuilder.group({
      pif: ["", [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(16),
        Validators.pattern("[a-z0-9-]+(:[a-z0-9-]+)?")]],
    });

    this.awsForm = this.formBuilder.group({
      access_key_id: ["", [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secret_access_key: ["", [<any>Validators.required, <any>Validators.minLength(2)]],
      ssh_key: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]]
    });

    this.digitalOceanForm = this.formBuilder.group({
      access_token: ["", [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64),
        Validators.pattern("[a-z0-9]+")]],
      ssh_key: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]]
    });

    this.awsForm.valueChanges.subscribe(value => {
      if (this.awsForm.controls["access_key_id"].valid && this.awsForm.controls["secret_access_key"].valid) {
        let body = {username: this.awsForm.controls["access_key_id"].value ,
          password: this.awsForm.controls["secret_access_key"].value};

        this.api.getSSHKeys(this.selectedCloudRegion.metadata.name, body)
          .subscribe(result => {
              // TODO consume api call
              this.selectedCloudProviderApiError = null;
              this.sshKeys = result;
            },
            error => {
              this.selectedCloudProviderApiError = error.status + " " + error.statusText;
            });
      }
    });

    this.digitalOceanForm.valueChanges.subscribe(value => {
      if (this.digitalOceanForm.controls["access_token"].valid) {
        let body = {token: this.digitalOceanForm.controls["access_token"].value};

        this.api.getSSHKeys("digitalocean", body)
          .subscribe(result => {
              // TODO consume api call
              this.selectedCloudProviderApiError = null;
              console.log(JSON.stringify(result));
            },
            error => {
              this.selectedCloudProviderApiError = error.status + " " + error.statusText;
            });
      }
    });
  }

  public selectCloud(cloud: string) {
    this.selectedCloud = cloud;
    this.selectedCloudRegion = null;

    if (cloud == "aws") {
      this.nodeSize = ['t2.nano', 't2.micro', 't2.small', 't2.medium', 't2.large', 'm4.large', 'm4.xlarge', 'm4.2xlarge', 'm4.4xlarge', 'm4.10xlarge', 'm4.16xlarge', 'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge'];
    } else if (cloud == "digitalocean") {
      this.nodeSize = [];
    } else {
      this.nodeSize = [];
    }
  }

  public selectCloudRegion(cloud: DataCenterEntity) {
    this.selectedCloudRegion = cloud;
  }

  public getNodeCount(): string {
    if (this.selectedCloud === "aws") {
      return this.awsForm.controls["node_count"].value;
    } else if (this.selectedCloud === "digitalocean") {
      return this.digitalOceanForm.controls["node_count"].value;
    } else {
      return "-1";
    }
  }

  public getNodeSize(): string {
    if (this.selectedCloud === "aws") {
      return this.awsForm.controls["node_size"].value;
    } else if (this.selectedCloud === "digitalocean") {
      return this.digitalOceanForm.controls["node_size"].value;
    } else {
      return "-1";
    }
  }

  public refreshName() {
    this.clusterNameForm.patchValue({clustername: this.nameGenerator.generateName()});
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
        if (this.selectedCloud === "bringyourown") {
          return this.acceptBringYourOwn;
        } else {
          return !!this.selectedCloudRegion;
        }
      case 3:
        if (this.selectedCloud === "bringyourown") {
          return this.bringYourOwnForm.valid;
        } else if (this.selectedCloud === "aws") {
          return this.awsForm.valid;
        } else if (this.selectedCloud === "digitalocean") {
          return this.digitalOceanForm.valid;
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


  public createClusterAndNode(this) {

    console.log(this);

    debugger;
  }
}
