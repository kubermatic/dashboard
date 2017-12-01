import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { CreateNodeModel } from "../../shared/model/CreateNodeModel";
import { CreateClusterModel } from "../../shared/model/CreateClusterModel";
import { DataCenterEntity } from "../../shared/entity/DatacenterEntity";
import { ApiService } from "app/core/services/api/api.service";

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  @select(['wizard', 'setDatacenterForm', 'datacenter']) region$: Observable<DataCenterEntity>;
  public region: DataCenterEntity;

  @select(['wizard', 'nodeModel']) nodeModel$: Observable<CreateNodeModel>;
  public nodeModel: CreateNodeModel;

  @select(['wizard', 'clusterModel']) clusterModel$: Observable<CreateClusterModel>;
  public clusterModel: CreateClusterModel;

  public shhKeysList: string[]  = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getSSHKeys()
      .subscribe(
        result => {
          for (let item of result) {
            for (let key of this.clusterModel.sshKeys) {
              if (item.metadata.name === key) {
                this.shhKeysList.push(item.spec.name + ' - ' + item.spec.fingerprint);
              }
            }
          }
        }
      );
    
    this.provider$.combineLatest(this.region$, this.nodeModel$, this.clusterModel$)
      .subscribe((data: [string, DataCenterEntity, CreateNodeModel, CreateClusterModel]) => {
        const provider = data[0];
        const region = data[1];
        const nodeModel = data[2];
        const clusterModel = data[3];
  
        provider && (this.provider = provider);
        region && (this.region = region);
        nodeModel && (this.nodeModel = nodeModel);
        clusterModel && (this.clusterModel = clusterModel);
      });
  }

  public goToStep(step: number): void {
    WizardActions.goToStep(step);
  }
}
