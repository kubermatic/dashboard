import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-azure-node-options',
  templateUrl: './azure-node-options.component.html',
})
export class AzureNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  form: FormGroup;
  datacenter: DataCenterEntity;
  hideOptional = true;

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _addNodeService: NodeDataService,
    private readonly _wizardService: WizardService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      assignPublicIP: new FormControl(
        this.nodeData.spec.cloud.azure.assignPublicIP
      ),
    });

    this._wizardService.clusterSettingsFormViewChanged$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.hideOptional = data.hideOptional;
      });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        azure: {
          size: this.nodeData.spec.cloud.azure.size,
          assignPublicIP: this.form.controls.assignPublicIP.value,
          tags: this.nodeData.spec.cloud.azure.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
