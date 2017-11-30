import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CreateNodeModel} from "../../shared/model/CreateNodeModel";
import {CreateClusterModel} from "../../shared/model/CreateClusterModel";
import {DataCenterEntity} from "../../shared/entity/DatacenterEntity";
import {ApiService} from "app/core/services/api/api.service";

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() clusterSpec: CreateClusterModel;
  
  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  @select(['wizard', 'setDatacenterForm', 'datacenter']) region$: Observable<DataCenterEntity>;
  public region: DataCenterEntity;

  @select(['wizard', 'nodeModel']) nodeModel$: Observable<CreateNodeModel>;
  public nodeModel: CreateNodeModel;

  public shhKeysList: string[]  = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getSSHKeys()
      .subscribe(
        result => {
          for (let item of result) {
            for (let key of this.clusterSpec.sshKeys) {
              if (item.metadata.name === key) {
                this.shhKeysList.push(item.spec.name + ' - ' + item.spec.fingerprint);
              }
            }
          }
        }
      );
    
    this.provider$.combineLatest(this.region$, this.nodeModel$)
      .subscribe((data: [string, DataCenterEntity, CreateNodeModel]) => {
        const provider = data[0];
        const region = data[1];
        const nodeModel = data[2];
  
        provider && (this.provider = provider);
        region && (this.region = region);
        nodeModel && (this.nodeModel = nodeModel);
      });
  }

  public goToStep(step: number): void {
    WizardActions.goToStep(step);
  }
}
