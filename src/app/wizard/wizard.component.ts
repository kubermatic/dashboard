import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";
import {ClusterNameGenerator} from "../util/name-generator.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";


@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})
export class WizardComponent implements OnInit {

  public seedDataCenters: DataCenterEntity[] = [];
  public supportedNodeProviders: string[] = ["aws", "digitalocean", "bringyourown"];
  public groupedDatacenters: {[key: string]: DataCenterEntity[]} = {};

  public currentStep: number = 0;
  public stepsTitles: string[] = ["Data center", "Cloud provider", "Configuration", "Go!"];

  public selectedDC: DataCenterEntity;
  public selectedCloud: string;
  public selectedCloudRegion: DataCenterEntity;
  public selectedCloudProviderApiError: string;
  public acceptBringYourOwn: boolean;

  public clusterNameForm: FormGroup;
  public awsForm: FormGroup;
  public digitaloceanForm: FormGroup;
  public bringYourOwnForm: FormGroup;

  constructor(private api: ApiService, private nameGenerator: ClusterNameGenerator, private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.api.getDataCenters().subscribe(result => {
      this.seedDataCenters = result.filter(elem => elem.seed)
        .sort((a, b) => DataCenterEntity.sortByName(a, b));

      result.forEach(elem => {
        if (!this.groupedDatacenters.hasOwnProperty(elem.spec.provider)) {
          this.groupedDatacenters[elem.spec.provider] = [];
        }

        this.groupedDatacenters[elem.spec.provider].push(elem);
      });
      // console.log(JSON.stringify(this.seedDataCenters));
    });

    this.clusterNameForm = this.formBuilder.group({
      clustername: [this.nameGenerator.generateName(), [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(16)]],
    });

    this.bringYourOwnForm = this.formBuilder.group({
      pif: ["", [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(16),
        Validators.pattern("[a-z0-9-]+(:[a-z0-9-]+)?")]],
    });

    this.awsForm = this.formBuilder.group({
      access_key_id: ["", [<any>Validators.required, <any>Validators.minLength(16), <any>Validators.maxLength(32)]],
      secret_access_key: ["", [<any>Validators.required, <any>Validators.minLength(2)]],
      ssh_key: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]]
    });

    this.digitaloceanForm = this.formBuilder.group({
      access_token: ["", [<any>Validators.required, <any>Validators.minLength(64), <any>Validators.maxLength(64)],
        Validators.pattern("[a-z0-9]+")],
      ssh_key: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]]
    });

    this.awsForm.valueChanges.subscribe(value => {
      if (this.awsForm.controls["access_key_id"].valid && this.awsForm.controls["secret_access_key"].valid) {
        let body = {username: this.awsForm.controls["access_key_id"].value ,
          password: this.awsForm.controls["secret_access_key"].value};

        this.api.getSSHKeys("aws", body)
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

    this.digitaloceanForm.valueChanges.subscribe(value => {
      if (this.digitaloceanForm.controls["access_token"].valid) {
        let body = {token: this.digitaloceanForm.controls["access_token"].value};

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

  public selectDC(dc: DataCenterEntity) {
    this.selectedDC = dc;
    this.selectedCloud = null;
    this.selectedCloudRegion = null;
  }

  public selectCloud(cloud: string) {
    this.selectedCloud = cloud;
    this.selectedCloudRegion = null;
  }

  public selectCloudRegion(cloud: DataCenterEntity) {
    this.selectedCloudRegion = cloud;
  }

  public getNodeCount(): string {
    if (this.selectedCloud === "aws") {
      return this.awsForm.controls["node_count"].value;
    } else if (this.selectedCloud === "digitalocean") {
      return this.digitaloceanForm.controls["node_count"].value;
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
        return !!this.selectedDC;
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
          return this.bringYourOwnForm.valid && this.clusterNameForm.valid;
        } else if (this.selectedCloud === "aws") {
          return this.clusterNameForm.valid && this.awsForm.valid;
        } else if (this.selectedCloud === "digitalocean") {
          return this.clusterNameForm.valid && this.digitaloceanForm.valid;
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
}
