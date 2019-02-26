import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {HealthService} from '../../core/services';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {ClusterHealth} from '../../shared/model/ClusterHealthConstants';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss'],
})
export class ClusterHealthStatusComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  green = 'fa fa-circle green';
  red = 'fa fa-circle red';
  orange = 'fa fa-spin fa-circle-o-notch orange';
  healthStatus: string;
  health: HealthEntity;
  private subscriptions: Subscription[] = [];

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this._getClusterHealth();
    const timer = interval(5000);
    this.subscriptions.push(timer.subscribe(() => {
      this._getClusterHealth();
    }));
  }

  _getClusterHealth(): void {
    this.healthService.getClusterHealth(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .subscribe((health) => {
          this.healthStatus = this.healthService.getClusterHealthStatus(this.cluster, health);
          this.health = health;
        });
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getHealthStatusColor(): string {
    if (this.health) {
      if (this.healthStatus === ClusterHealth.RUNNING) {
        return this.green;
      } else if (this.healthStatus === ClusterHealth.DELETING) {
        return this.red;
      } else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }

  getHealthTooltipText(): string {
    if (this.healthStatus === ClusterHealth.DELETING) {
      return 'Deleting might take up to 15 minutes';
    }
    return '';
  }
}
