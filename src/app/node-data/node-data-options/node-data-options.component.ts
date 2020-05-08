import {Component, Input} from '@angular/core';

import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-node-data-options',
  templateUrl: './node-data-options.component.html',
})
export class NodeDataOptionsComponent {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  @Input() isInWizard: boolean;
}
