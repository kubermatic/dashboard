import {Component, Input} from '@angular/core';
import {MatTabChangeEvent} from '@angular/material';
import {WizardService} from '../../core/services';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
})
export class SetSettingsComponent {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  @Input() nodeData: NodeData;

  constructor(private wizardService: WizardService) {}

  changeView(event: MatTabChangeEvent): void {
    switch (event.tab.textLabel) {
      case 'Simple':
        this.wizardService.changeSettingsFormView({hideOptional: true});
        break;
      case 'Extended':
        this.wizardService.changeSettingsFormView({hideOptional: false});
        break;
      default:
        this.wizardService.changeSettingsFormView({hideOptional: true});
    }
  }
}
