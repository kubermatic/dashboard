import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { WizardService } from '../../../core/services/wizard/wizard.service';

@Component({
  selector: 'kubermatic-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
  styleUrls: ['./provider-settings.component.scss']
})
export class ClusterProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  constructor(private wizardService: WizardService) { }

  ngOnInit() { }

  ngOnDestroy() { }
}
