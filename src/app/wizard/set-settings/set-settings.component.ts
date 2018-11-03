import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { NodeData } from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss'],
})
export class SetSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  @Input() nodeData: NodeData;

  constructor(private wizardService: WizardService) { }

  ngOnInit(): void { }

  ngOnDestroy(): void { }

  public changeView(event: MatTabChangeEvent): void {
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
