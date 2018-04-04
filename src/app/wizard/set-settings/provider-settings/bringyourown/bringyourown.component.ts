import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-bringyourown-cluster-settings',
  templateUrl: './bringyourown.component.html',
  styleUrls: ['./bringyourown.component.scss']
})
export class BringyourownClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  constructor() { }

  ngOnInit() { }

  ngOnDestroy() { }
}
