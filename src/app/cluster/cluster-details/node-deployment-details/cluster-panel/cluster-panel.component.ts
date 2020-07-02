import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';

import {Cluster} from '../../../../shared/entity/cluster';
import {Datacenter} from '../../../../shared/entity/datacenter';

@Component({
  selector: 'km-cluster-panel',
  templateUrl: './cluster-panel.component.html',
})
export class ClusterPanelComponent {
  @Input() cluster: Cluster;
  @Input() datacenter: Datacenter;
  @Input() dcName: string;
  @Input() projectID: string;

  constructor(private readonly _router: Router) {}

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return Cluster.getVersionHeadline(type, isKubelet);
  }

  navigate(): void {
    this._router.navigate(['/projects/' + this.projectID + '/dc/' + this.dcName + '/clusters/' + this.cluster.id]);
  }
}
