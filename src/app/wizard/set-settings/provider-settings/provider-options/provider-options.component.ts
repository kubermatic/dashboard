import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'km-cluster-provider-options',
  templateUrl: './provider-options.component.html',
})
export class ClusterProviderOptionsComponent {
  @Input() cluster: ClusterEntity;
}
