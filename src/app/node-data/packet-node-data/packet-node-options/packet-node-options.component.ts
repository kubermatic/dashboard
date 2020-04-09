import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-packet-node-options',
  templateUrl: './packet-node-options.component.html',
})

export class PacketNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  hideOptional = true;
  private _unsubscribe: Subject<any> = new Subject();

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
        packet: {
          instanceType: this.nodeData.spec.cloud.packet.instanceType,
          tags: this.nodeData.spec.cloud.packet.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
