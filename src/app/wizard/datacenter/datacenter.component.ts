import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";
import {ApiService} from "../../api/api.service";

@Component({
  selector: 'kubermatic-datacenter',
  templateUrl: './datacenter.component.html',
  styleUrls: ['./datacenter.component.scss']
})
export class DatacenterComponent implements OnInit {
  @Input() datacenter: DataCenterEntity[];
  @Output() syncDatacenter =  new EventEmitter();

  public selectedProviderRegion: DataCenterEntity;



  constructor(private api: ApiService) {



  }

  ngOnInit() {

  }

  public selectDatacenter(datacenter: DataCenterEntity) {
    this.selectedProviderRegion = datacenter;
    this.syncDatacenter.emit(this.selectedProviderRegion);
  }
}
