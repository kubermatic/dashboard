import {Component, forwardRef, OnInit} from '@angular/core';
import {BaseFormValidator} from '@app/shared/validators/base-form.validator';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import { NodeProvider } from '@app/shared/model/NodeProviderConstants';
import { ClusterSpecService } from '@app/core/services/cluster-spec';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogDataOutput } from '@app/node-data/dialog/component';
import { ExternalMachineDeployment } from '@app/shared/entity/external-machine-deployment';
import {getIconClassForButton} from '@shared/utils/common';
// import { NodeDataService } from '@app/core/services/node-data/service';
// import { BaseFormValidator } from '@app/shared/validators/base-form.validator';

enum Controls {
  MachineDeploymentData = 'machineDeploymentData',
}

@Component({
  selector: 'km-add-external-machine-deployment-dialog',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddExternalMachineDeploymentDialogComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AddExternalMachineDeploymentDialogComponent),
      multi: true,
    },
  ],
})
export class AddExternalMachineDeploymentDialogComponent extends BaseFormValidator implements OnInit {
  mode = 'edit';
  readonly Controls = Controls;
  private _output: DialogDataOutput = {ExternalMachineDeploymentData: ExternalMachineDeployment.NewEmptyMachineDeployment()} as DialogDataOutput;


  get provider(): NodeProvider {    
    return this._clusterSpecService.provider;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService,
    // @Inject(MAT_DIALOG_DATA) private _data: DialogDataInput,
    private _dialogRef: MatDialogRef<AddExternalMachineDeploymentDialogComponent>,

  ) {
    super();
   }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.MachineDeploymentData]: this._builder.control(''),});
  }

  onConfirm(): void {
    this._dialogRef.close(this._output);
  }

  getIconClass(): string {
    return getIconClassForButton(this.mode);
  }

}
