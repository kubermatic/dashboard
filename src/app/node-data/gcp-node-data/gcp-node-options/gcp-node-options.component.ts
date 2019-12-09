import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-gcp-node-options',
  templateUrl: './gcp-node-options.component.html',
})

export class GCPNodeOptionsComponent implements OnInit, OnDestroy {
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
        gcp: {
          diskSize: this.nodeData.spec.cloud.gcp.diskSize,
          diskType: this.nodeData.spec.cloud.gcp.diskType,
          machineType: this.nodeData.spec.cloud.gcp.machineType,
          preemptible: this.nodeData.spec.cloud.gcp.preemptible,
          zone: this.nodeData.spec.cloud.gcp.zone,
          labels: this.nodeData.spec.cloud.gcp.labels,
          tags: this.nodeData.spec.cloud.gcp.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
