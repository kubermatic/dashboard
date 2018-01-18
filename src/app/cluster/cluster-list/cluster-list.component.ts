import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../core/services/api/api.service';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { find } from 'lodash';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit, OnDestroy {

  public clusters: ClusterEntity[] = [];
  public timer: any = Observable.timer(0, 10000);
  public sub: Subscription;
  public loading: boolean = true;

  constructor(public api: ApiService) { }

  ngOnInit() {
    this.sub = this.timer.subscribe(() => {
      this.getClusters();
    });
  }

  getClusters() {
    this.api.getClusters().subscribe(result => {
      this.clusters = result;
      this.loading = false;
    });
  }

  public trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, item => {
      return item.metadata.name === cluster.metadata.name;
    });

    return prevCluster && prevCluster.status.phase === cluster.status.phase ? index : undefined;
  }

  ngOnDestroy() {
    this.sub && this.sub.unsubscribe();
  }
}
