import { DatacenterSpec } from './../../shared/entity/DatacenterEntity';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {DataCenterEntity} from "../../shared/entity/DatacenterEntity";
import {ApiService} from "app/core/services/api/api.service";

@Component({
  selector: 'kubermatic-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss']
})
export class SetDatacenterComponent implements OnInit {
  @Input() datacenter: DataCenterEntity[];
  @Input() selectedDatacenter: DataCenterEntity;
  @Output() syncDatacenter =  new EventEmitter();
  public setDatacenterForm: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.setDatacenterForm = this.fb.group({
      datacenter: [null]
    });
  }

  public selectDatacenter(datacenter: DataCenterEntity) {
    this.selectedDatacenter = datacenter;
    this.syncDatacenter.emit(datacenter);
  }
}
