import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {CloudSpec} from '../../../shared/entity/ClusterEntity';
import {ResourceType} from '../../../shared/entity/LabelsEntity';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';
import {AsyncValidators} from '../../../shared/validators/async-label-form.validator';

@Component({
  selector: 'kubermatic-openstack-node-options',
  templateUrl: './openstack-node-options.component.html',
  styleUrls: ['./openstack-node-options.component.scss'],
})

export class OpenstackNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  @Input() isInWizard: boolean;

  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.NodeDeployment)];
  hideOptional = true;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getOsOptionsData(): NodeProviderData {
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
