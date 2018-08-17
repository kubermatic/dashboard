import { Component, Input, OnChanges } from '@angular/core';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { HealthEntity } from '../../shared/entity/HealthEntity';
import { HealthService } from '../../core/services';
import { ClusterHealth } from '../../shared/model/ClusterHealthConstants';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnChanges {
  @Input() public cluster: ClusterEntity;
  @Input() public datacenter: DataCenterEntity;
  @Input() public project: ProjectEntity;

  public green = 'fa fa-circle green';
  public red = 'fa fa-circle red';
  public orange = 'fa fa-spin fa-circle-o-notch orange';
  public redAction = 'fa fa-exclamation-triangle red';
  public healthStatus: string;
  public health: HealthEntity;

  constructor(private healthService: HealthService) {}

  ngOnChanges() {
    this.healthService.getClusterHealth(this.cluster.id, this.datacenter.metadata.name, this.project.id).subscribe(health => {
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
