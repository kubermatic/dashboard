import { Subscription } from 'rxjs/Subscription';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ClusterEntity, Health } from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-item',
  templateUrl: './cluster-item.component.html',
  styleUrls: ['./cluster-item.component.scss']
})
export class ClusterItemComponent implements OnInit, OnDestroy {
  @Input() sortedData: ClusterEntity;
  @Input() index: number;
  @Input() health: Health;
  @Input() seedDc: DataCenterEntity[];
  @Input() nodeDc: DataCenterEntity[];

  constructor() {}

  public ngOnInit(): void {}

  public getDc(dcName: string, dcObjectName: string): string {
    let country: string;
    let location: string;

    if (dcObjectName === 'nodeDc') {
      for (const i in this.nodeDc) {
        if (this.nodeDc[i].metadata.name === dcName) {
          country = this.nodeDc[i].spec.country;
          location = this.nodeDc[i].spec.location;
        } else if (dcName === '') {
          return '';
        }
      }
    }

    if (dcObjectName === 'seedDc') {
      for (const i in this.seedDc) {
        if (this.seedDc[i].metadata.name === dcName) {
          country = this.seedDc[i].spec.country;
          location = this.seedDc[i].spec.location;
        } else if (dcName === '') {
          return '';
        }
      }
    }

    return (country + ' (' + location + ')');
  }

  public getClusterImagePath(): string {
    let path: string = '/assets/images/clouds/';

    if (this.sortedData.spec.cloud.aws) {
      path += 'aws.png';
    } else if (this.sortedData.spec.cloud.digitalocean) {
      path += 'digitalocean.png';
    } else if (this.sortedData.spec.cloud.openstack) {
      path += 'openstack.png';
    } else if (this.sortedData.spec.cloud.bringyourown) {
      path += 'bringyourown.png';
    }

    return path;
  }

  public getShortClusterName(name: string): string {
    return name.length > 12 ?  name.slice(0, 12) + '...' : name;
  }

  public statusRunning(): boolean {
    if (this.sortedData.status.phase === 'Running') {
      if (this.health) {
        if (!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.nodeController || !this.health.scheduler) {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  public statusFailed(): boolean {
    if (this.sortedData.status.phase === 'Failed') {
      return true;
    } else {
      return false;
    }
  }

  public statusWaiting(): boolean {
    if (this.sortedData.status.phase !== 'Running' && this.sortedData.status.phase !== 'Failed') {
      return true;
    } else {
      if (this.health) {
        if ((!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.nodeController || !this.health.scheduler) && this.sortedData.status.phase === 'Running') {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  public ngOnDestroy(): void { }
}
