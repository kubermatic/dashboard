import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CreateNodeModel} from "../../api/model/CreateNodeModel";
import {CreateClusterModel} from "../../api/model/CreateClusterModel";
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";
import {ApiService} from "../../api/api.service";

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() provider: string;
  @Input() region: DataCenterEntity;
  @Input() clusterSpec: CreateClusterModel;
  @Input() nodeSpec: CreateNodeModel;

  @Output() syncStep = new EventEmitter();

  public shhKeysList: string[]  = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getSSHKeys()
      .subscribe(
        result => {
          for (var item of result) {
            for (var key of this.clusterSpec.sshKeys)
            if (item.metadata.name == key) {
              this.shhKeysList.push(item.spec.name + ' - ' + item.spec.fingerprint);
            }
          }
        }
      );
  }

  public gotoStep(step: number) {
      this.syncStep.emit(step);
  }
}
