import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-openstack-node-options',
  templateUrl: './openstack-node-options.component.html',
  styleUrls: ['./openstack-node-options.component.scss'],
})

export class OpenstackNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  hideOptional = true;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _nodeDataService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        openstack: {
          flavor: this.nodeData.spec.cloud.openstack.flavor,
          image: this.nodeData.spec.cloud.openstack.image,
          useFloatingIP: this.nodeData.spec.cloud.openstack.useFloatingIP,
          diskSize: this.nodeData.spec.cloud.openstack.diskSize,
          tags: this.nodeData.spec.cloud.openstack.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
