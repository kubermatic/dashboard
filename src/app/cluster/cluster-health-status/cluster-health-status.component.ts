import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { HealthEntity } from '../../shared/entity/HealthEntity';
import { HealthService } from '../../core/services';
import { ClusterHealth } from '../../shared/model/ClusterHealthConstants';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnInit {
  @Input() public cluster: ClusterEntity;
  @Input() public datacenter: DataCenterEntity;
  @Input() public projectID: string;

  public green = 'fa fa-circle green';
  public red = 'fa fa-circle red';
  public orange = 'fa fa-spin fa-circle-o-notch orange';
  public redAction = 'fa fa-exclamation-triangle red';
  public healthStatus: string;
  public health: HealthEntity;
  private subscriptions: Subscription[] = [];

  constructor(private healthService: HealthService) {}

  ngOnInit() {
    const timer = Observable.interval(5000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.healthService.getClusterHealth(this.cluster.id, this.datacenter.metadata.name, this.projectID).subscribe(health => {
        this.healthStatus = this.healthService.getClusterHealthStatus(this.cluster, health);
        this.health = health;
      });
    }));

    this.healthService.getClusterHealth(this.cluster.id, this.datacenter.metadata.name, this.projectID).subscribe(health => {
        this.healthStatus = this.healthService.getClusterHealthStatus(this.cluster, health);
        this.health = health;
      });
  }

  public getHealthStatusColor(): string {
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

  public getHealthTooltipText(): string {
    if (this.healthStatus === ClusterHealth.DELETING) {
      return 'Deleting might take up to 15 minutes';
    } /*else if (!!this.cluster.spec.pause) {
      return 'Manual action required';
    } else {
      return '';
    }*/
    return '';
  }
}
