import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit {

  @Input() provider: string;
  @Input() token: string;

  @Output() syncNodeModel = new EventEmitter();


  constructor() { }

  ngOnInit() { }

  public getNodeModel(model) {
    this.syncNodeModel.emit(model);
  }

}
