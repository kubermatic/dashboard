import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

import {NodeProvider} from "../../api/model/NodeProviderConstants";
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";

@Component({
  selector: 'kubermatic-provider',
  templateUrl: './provider.component.html',
  styleUrls: ['./provider.component.scss']
})
export class ProviderComponent implements OnInit {
  @Input() provider: { [key: string]: DataCenterEntity[] } = {};
  @Output() syncProvider =  new EventEmitter();
  public supportedNodeProviders: string[] = [NodeProvider.AWS, NodeProvider.DIGITALOCEAN, NodeProvider.BRINGYOUROWN, NodeProvider.BAREMETAL, NodeProvider.OPENSTACK];
  public selectedCloud: string = NodeProvider.AWS;

  constructor() { }

  ngOnInit() { }

  public selectCloud(cloud: string) {
    this.selectedCloud = cloud;
    this.syncProvider.emit(this.selectedCloud);
  }
}
