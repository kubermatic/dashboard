import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { Observable } from 'rxjs/Rx';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import {Component, OnInit } from '@angular/core';
import { DataCenterEntity } from "../../shared/entity/DatacenterEntity";
import { ApiService } from "app/core/services/api/api.service";

@Component({
  selector: 'kubermatic-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss']
})
export class SetDatacenterComponent implements OnInit {
  public setDatacenterForm: FormGroup;
  public datacenters: { [key: string]: DataCenterEntity[] } = {};  

  @select(['wizard', 'setDatacenterForm', 'datacenter']) datacenter$: Observable<DataCenterEntity>;
  public selectedDatacenter: DataCenterEntity;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string;

  constructor(private fb: FormBuilder,
              private dcService: DatacenterService) { }

  ngOnInit() {
    this.datacenter$.combineLatest(this.provider$)
      .subscribe((data: [DataCenterEntity, string]) => {
        const datacenter = data[0];
        const provider = data[1];

        datacenter && (this.selectedDatacenter = datacenter);
        provider && (this.selectedProvider = provider);
      });

    this.getDatacenters();

    this.setDatacenterForm = this.fb.group({
      datacenter: [null]
    });
  }

  public getDatacenters(): void {
    this.dcService.getDataCenters().subscribe(result => {
      result.forEach(elem => {
        if (!elem.seed) {
          if (!this.datacenters.hasOwnProperty(elem.spec.provider)) {
            this.datacenters[elem.spec.provider] = [];
          }

          this.datacenters[elem.spec.provider].push(elem);
        }
      });
    });
  }
}
