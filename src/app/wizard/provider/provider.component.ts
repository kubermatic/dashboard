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
