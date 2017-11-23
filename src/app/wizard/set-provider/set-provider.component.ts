import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NodeProvider} from "../../shared/model/NodeProviderConstants";
import {DataCenterEntity} from "../../shared/entity/DatacenterEntity";

@Component({
  selector: 'kubermatic-set-provider',
  templateUrl: 'set-provider.component.html',
  styleUrls: ['set-provider.component.scss']
})
export class SetProviderComponent implements OnInit {

  @Input() provider: { [key: string]: DataCenterEntity[] } = {};
  @Input() selectedProvider: string;
  @Output() syncProvider =  new EventEmitter();
  public supportedNodeProviders: string[] = NodeProvider.Supported;

  constructor() { }

  ngOnInit() { }

  public selectProvider(provider: string) {
    this.selectedProvider = provider;
    this.syncProvider.emit(this.selectedProvider);
  }
}
