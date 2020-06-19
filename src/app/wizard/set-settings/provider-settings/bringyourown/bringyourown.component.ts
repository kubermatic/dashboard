import {Component, Input} from '@angular/core';
import {Cluster} from '../../../../shared/entity/cluster';

@Component({
  selector: 'km-bringyourown-cluster-settings',
  templateUrl: './bringyourown.component.html',
})
export class BringyourownClusterSettingsComponent {
  @Input() cluster: Cluster;
}
