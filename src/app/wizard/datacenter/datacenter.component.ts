import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";

@Component({
  selector: 'kubermatic-datacenter',
  templateUrl: './datacenter.component.html',
  styleUrls: ['./datacenter.component.scss']
})
export class DatacenterComponent implements OnInit {
  @Input() datacenter: DataCenterEntity[];
  @Output() syncDatacenter =  new EventEmitter();

  public selectedCloudRegion: DataCenterEntity;

  constructor() { }

  ngOnInit() {

  }

  public selectDatacenter(datacenter: DataCenterEntity) {
    this.selectedCloudRegion = datacenter;
    this.syncDatacenter.emit(this.selectedCloudRegion);
  }
}
