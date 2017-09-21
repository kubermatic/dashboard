import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";
import {ApiService} from "../../api/api.service";

@Component({
  selector: 'kubermatic-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss']
})
export class SetDatacenterComponent implements OnInit {
  @Input() datacenter: DataCenterEntity[];
  @Output() syncDatacenter =  new EventEmitter();

  public selectedProviderRegion: DataCenterEntity;

  constructor() { }

  ngOnInit() { }

  public selectDatacenter(datacenter: DataCenterEntity) {
    this.selectedProviderRegion = datacenter;
    this.syncDatacenter.emit(datacenter);
  }
}
