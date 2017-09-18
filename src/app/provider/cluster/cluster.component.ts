import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-provider-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.scss']
})
export class ProviderClusterComponent implements OnInit {

  constructor() { }

  @Input() provider: string;
  @Output() syncCloudSpec = new EventEmitter();

  ngOnInit() { }

  public setCloud(spec) {
    this.syncCloudSpec.emit(spec);
  }
}
