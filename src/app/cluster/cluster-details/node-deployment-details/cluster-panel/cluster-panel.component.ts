import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';

import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';
import {ClusterUtils} from '../../../../shared/utils/cluster-utils/cluster-utils';

@Component({
  selector: 'km-cluster-panel',
  templateUrl: './cluster-panel.component.html',
  styleUrls: ['./cluster-panel.component.scss'],
})

export class ClusterPanelComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() dcName: string;
  @Input() projectID: string;

  constructor(private readonly _router: Router) {}

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  navigate(): void {
    this._router.navigate(['/projects/' + this.projectID + '/dc/' + this.dcName + '/clusters/' + this.cluster.id]);
  }
}
