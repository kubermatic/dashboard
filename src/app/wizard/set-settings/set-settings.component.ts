import {Component, Input} from '@angular/core';
import {WizardService} from '../../core/services';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss'],
})
export class SetSettingsComponent {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  @Input() nodeData: NodeData;
  isExtended = false;

  constructor(private wizardService: WizardService) {}

  extend(): void {
    this.isExtended = true;
    this.wizardService.changeSettingsFormView({hideOptional: !this.isExtended});
  }
}
