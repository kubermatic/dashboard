import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";


@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
})
export class WizardComponent implements OnInit {

  public seedDataCenters: DataCenterEntity[] = []; // TODO question why does this list contain sometimes gke and D.O. sometimes not?
  public nodeDataCenters: DataCenterEntity[] = [];
  public supportedNodeProviders: string[] = ["aws", "digitalocean", "bringyourown"];
  public groupedDatacenters: {[key: string]: DataCenterEntity[]} = {}; // TODO aws IReland shows Iran flag

  public currentStep: number = 0;
  public stepsTitles: string[] = ["Data center", "Cloud provider", "Configuration", "Go!"];

  public selectedDC: string;
  public selectedCloud: string;
  public selectedCloudRegion: string;
  private selectedNodeCount: number = 3;
  private selectedName: string;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getDataCenters().subscribe(result => {
      this.seedDataCenters = result.filter(elem => elem.seed)
        .sort((a, b) => DataCenterEntity.sortByName(a, b));

      result.forEach(elem => {
        if (!this.groupedDatacenters.hasOwnProperty(elem.spec.provider)) {
          this.groupedDatacenters[elem.spec.provider]= [];
        }

        this.groupedDatacenters[elem.spec.provider].push(elem);
      });
      // console.log(JSON.stringify(this.seedDataCenters));
    });
  }

  public selectDC(dc: string) {
    this.selectedDC = dc;
  }

  public selectCloud(cloud: string) {
    this.selectedCloud = cloud;
  }

  public selectCloudRegion(cloud: string) {
    this.selectedCloudRegion = cloud;
  }

  public selectName(name: string) {
    this.selectedName = name;
  }

  public selectNodeCount(nodeCount: number) {
    this.selectedNodeCount = nodeCount;
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
    switch (this.currentStep) {
      case 0:
        return !!this.selectedDC;
      case 1:
        return !!this.selectedCloud;
      case 2:
        return !!this.selectedCloudRegion;
      case 3:
        return !!this.selectedName;
      case 4:
        return !!this.selectedNodeCount && this.selectedNodeCount >= 0;
      default:
        return false;
    }
  }
}
