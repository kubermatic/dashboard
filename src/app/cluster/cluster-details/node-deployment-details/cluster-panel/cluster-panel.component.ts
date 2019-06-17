import {Component, Input} from '@angular/core';

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

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }
}
