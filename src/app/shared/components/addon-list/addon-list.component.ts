import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ApiService, ClusterService} from '../../../core/services';
import {AddonEntity} from '../../entity/AddonEntity';
import {ClusterEntity} from '../../entity/ClusterEntity';
import {DataCenterEntity} from '../../entity/DatacenterEntity';
import {ClusterHealthStatus} from '../../utils/health-status/cluster-health-status';

@Component({
  selector: 'km-addon-list',
  templateUrl: 'addon-list.component.html',
  styleUrls: ['addon-list.component.scss'],
})
export class AddonsListComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @Input() clusterHealthStatus: ClusterHealthStatus;
  @Input() isClusterRunning: boolean;
  installedAddons: AddonEntity[] = [];
  accessibleAddons: string[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _apiService: ApiService, private readonly _clusterService: ClusterService) {}

  ngOnInit(): void {
    this._apiService.getAccessibleAddons().pipe(takeUntil(this._unsubscribe)).subscribe(accessibleAddons => {
      this.accessibleAddons = accessibleAddons;
    });

    this._clusterService.addons(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(installedAddons => {
          this.installedAddons = installedAddons;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  areAllAddonsInstalled(): boolean {
    return this.installedAddons.length === this.accessibleAddons.length;
  }
}
