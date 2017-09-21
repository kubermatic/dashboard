import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CreateNodeModel} from "../../api/model/CreateNodeModel";
import {CreateClusterModel} from "../../api/model/CreateClusterModel";
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";

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

  constructor() { }

  ngOnInit() { }

  public gotoStep(step: number) {
      this.syncStep.emit(step);
  }
}
