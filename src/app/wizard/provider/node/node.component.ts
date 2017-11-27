import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CreateNodeModel} from "../../../shared/model/CreateNodeModel";

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit {

  @Input() provider: string;
  @Input() token: string;
  @Input() node: CreateNodeModel;

  @Output() syncNodeModel = new EventEmitter();
  @Output() syncNodeSpecValid = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  public getNodeModel(model) {
    this.syncNodeModel.emit(model);
  }

  public valid(value) {
    this.syncNodeSpecValid.emit(value);
  }

}
