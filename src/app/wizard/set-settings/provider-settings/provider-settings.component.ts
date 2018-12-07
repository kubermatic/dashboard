import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
})
export class ClusterProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
