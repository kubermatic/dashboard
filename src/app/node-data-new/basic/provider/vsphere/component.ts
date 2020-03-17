import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {VSphereNodeSpec} from '../../../../shared/entity/node/VSphereNodeSpec';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  CPU = 'cpu',
  Memory = 'memory',
}

@Component({
  selector: 'kubermatic-vsphere-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => VSphereBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => VSphereBasicNodeDataComponent), multi: true}
  ]
})
export class VSphereBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.CPU]: this._builder.control(2, [Validators.required, Validators.min(1)]),
      [Controls.Memory]: this._builder.control(512, [Validators.required, Validators.min(512)]),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    merge(
        this.form.get(Controls.Memory).valueChanges,
        this.form.get(Controls.CPU).valueChanges,
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isInWizard(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vsphere: {
            cpus: this.form.get(Controls.CPU).value,
            memory: this.form.get(Controls.Memory).value,
          } as VSphereNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
