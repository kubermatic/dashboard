import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  Validators,
} from '@angular/forms';
import {StepBase} from '@app/external-cluster-wizard/steps/base';
import {ExternalClusterService} from '@core/services/external-cluster';
import {NameGeneratorService} from '@core/services/name-generator';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Name = 'name',
  Zone = 'zone',
  Version = 'version',
  NodeCount = 'nodeCount',
}

@Component({
  selector: 'km-gke-cluster-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GKEClusterSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GKEClusterSettingsComponent),
      multi: true,
    },
  ],
})
export class GKEClusterSettingsComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _nameGenerator: NameGeneratorService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {}

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Zone]: this._builder.control('', Validators.required),
      [Controls.Version]: this._builder.control('', Validators.required),
      [Controls.NodeCount]: this._builder.control('', Validators.required),
    });
  }

  generateName(): void {
    this.form.get(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  private _initSubscriptions() {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
    });
  }

  private _updateExternalClusterModel(): void {
    this._externalClusterService.externalCluster = {
      name: this.controlValue(Controls.Name),
      cloud: {
        gke: {
          ...this._externalClusterService.externalCluster.cloud?.gke,
          name: this.controlValue(Controls.Name),
          zone: this.controlValue(Controls.Zone),
        },
      },
      spec: {
        gkeclusterSpec: {
          initialClusterVersion: this.controlValue(Controls.Version),
          initialNodeCount: this.controlValue(Controls.NodeCount),
        },
      },
    };
  }
}
