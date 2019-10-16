import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';

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
  // private _unsubscribe: Subject<any> = new Subject();
  installedAddons: string[] = ['dashboard', 'node-exporter', 'grafana'];

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
