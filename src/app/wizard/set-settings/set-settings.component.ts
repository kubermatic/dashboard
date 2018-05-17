import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { NodeData } from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  @Input() nodeData: NodeData;

  constructor(private wizardService: WizardService) { }

  ngOnInit() { }

  ngOnDestroy() { }

  public changeView(event: MatTabChangeEvent) {
    switch (event.tab.textLabel) {
      case 'Simple':
        return this.wizardService.changeSettingsFormView({hideOptional: true});
      case 'Extended':
        return this.wizardService.changeSettingsFormView({hideOptional: false});
      default:
        return this.wizardService.changeSettingsFormView({hideOptional: true});
    }
  }
}
