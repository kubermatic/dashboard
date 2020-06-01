import {AfterViewChecked, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  CPUs = 'cpus',
  Memory = 'memory',
  Namespace = 'namespace',
  SourceURL = 'sourceURL',
  StorageClassName = 'storageClassName',
  PVCSize = 'pvcSize',
}

@Component({
  selector: 'km-kubevirt-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent),
      multi: true,
    },
  ],
})
export class KubeVirtBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewChecked {
  private readonly _sizeSuffixPattern = /^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.CPUs]: this._builder.control(1, Validators.required),
      [Controls.Memory]: this._builder.control('2Gi', [
        Validators.required,
        Validators.pattern(this._sizeSuffixPattern),
      ]),
      [Controls.Namespace]: this._builder.control('', Validators.required),
      [Controls.SourceURL]: this._builder.control('', Validators.required),
      [Controls.StorageClassName]: this._builder.control('', Validators.required),
      [Controls.PVCSize]: this._builder.control('10Gi', [
        Validators.required,
        Validators.pattern(this._sizeSuffixPattern),
      ]),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.Namespace).valueChanges,
      this.form.get(Controls.SourceURL).valueChanges,
      this.form.get(Controls.StorageClassName).valueChanges,
      this.form.get(Controls.PVCSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          kubevirt: {
            cpus: this.form.get(Controls.CPUs).value,
            memory: this.form.get(Controls.Memory).value,
            namespace: this.form.get(Controls.Namespace).value,
            sourceURL: this.form.get(Controls.SourceURL).value,
            storageClassName: this.form.get(Controls.StorageClassName).value,
            pvcSize: this.form.get(Controls.PVCSize).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
