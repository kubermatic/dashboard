import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from "rxjs";
import {WizardService} from "../../core/services";
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-hetzner-node-data',
  templateUrl: './hetzner-node-data.component.html',
})

export class HetznerNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;

  types: string[] = this._wizard.provider(NodeProvider.HETZNER).flavors();
  hetznerNodeForm: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.hetznerNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.hetzner.type, Validators.required),
    });

    if (this.nodeData.spec.cloud.hetzner.type === '') {
      this.hetznerNodeForm.controls.type.setValue(this.types[0].id);
    }

    this.hetznerNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        hetzner: {
          type: this.hetznerNodeForm.controls.type.value,
        },
      },
      valid: this.hetznerNodeForm.valid,
    };
  }
}
