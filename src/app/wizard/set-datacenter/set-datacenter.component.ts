import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../core/services';
import {ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity, getDatacenterProvider} from '../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss'],
})
export class SetDatacenterComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  setDatacenterForm: FormGroup;
  datacenters: DataCenterEntity[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private dcService: DatacenterService, private wizardService: WizardService) {}

  ngOnInit(): void {
    this.setDatacenterForm = new FormGroup({
      datacenter: new FormControl(this.cluster.spec.cloud.dc, [Validators.required]),
    });

    // Get all datacenters for the cluster cloud provider
    this.dcService.getDataCenters().pipe(takeUntil(this._unsubscribe)).subscribe((datacenters) => {
      const providerDatacenters: DataCenterEntity[] = [];
      for (const datacenter of datacenters) {
        if (datacenter.seed) {
          continue;
        }
        const provider = getDatacenterProvider(datacenter);
        const clusterProvider = getClusterProvider(this.cluster);
        if (provider === clusterProvider) {
          providerDatacenters.push(datacenter);
        }
      }
      this.datacenters = providerDatacenters;
    });

    this.setDatacenterForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.changeClusterDatacenter();
    });
  }

  changeClusterDatacenter(): void {
    let dc: DataCenterEntity = null;
    for (const datacenter of this.datacenters) {
      if (this.setDatacenterForm.controls.datacenter.value === datacenter.metadata.name) {
        dc = datacenter;
      }
    }
    this.wizardService.changeClusterDatacenter({
      datacenter: dc,
      valid: this.setDatacenterForm.valid,
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
