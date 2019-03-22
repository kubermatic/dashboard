import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-bringyourown-cluster-settings',
  templateUrl: './bringyourown.component.html',
})
export class BringyourownClusterSettingsComponent {
  @Input() cluster: ClusterEntity;
}
