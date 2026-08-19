//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {AbstractControl, FormArray, FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import {Component, OnInit, OnDestroy, Inject, ChangeDetectorRef} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {takeUntil, filter, tap, distinctUntilChanged, map} from 'rxjs/operators';
import {Observable, Subject, of} from 'rxjs';
import {FeatureGateService} from '@core/services/feature-gate';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {QuotaService} from '../service';
import {AcceleratorAccountingPhase, AcceleratorQuota, Quota, QuotaDetails, QuotaVariables} from '@shared/entity/quota';
import {KmValidators} from '@shared/validators/validators';
import {AcceleratorFormValidators} from '@shared/validators/accelerator-form.validators';
import {ControlsOf} from '@shared/model/shared';
import {Project} from '@shared/entity/project';
import _ from 'lodash';
import {ComboboxControls} from '@shared/components/combobox/component';

enum Error {
  Required = 'required',
  AtLeastOneRequired = 'atLeastOneRequired',
  IncorrectProject = 'incorrectProject',
}

const ACCELERATOR_PROVIDER = 'kubevirt';

type GpuResourceControls = {
  provider: FormControl<string>;
  key: FormControl<string>;
  value: FormControl<number>;
};

// ControlsOf<T> maps array-typed fields into a (nonsensical here) nested FormGroup/FormArray
// shape in this project's non-strict TS config, so accelerators is typed explicitly instead of
// being derived from QuotaVariables via ControlsOf.
type QuotaGroupControls = ControlsOf<Omit<QuotaVariables, 'accelerators'>> & {
  accelerators: FormControl<AcceleratorQuota[]>;
};
type QuotaFormControls = Omit<ControlsOf<Quota>, 'quota'> & {
  quota: FormGroup<QuotaGroupControls>;
};

@Component({
  selector: 'km-quota-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class ProjectQuotaDialogComponent implements OnInit, OnDestroy {
  private _unsubscribe = new Subject<void>();
  private _quotas: QuotaDetails[] = [];

  readonly Error = Error;

  form: FormGroup<QuotaFormControls>;
  gpuResources: FormArray<FormGroup<GpuResourceControls>>;
  acceleratorAccountingControl: FormControl<boolean>;
  hasAcceleratorQuotaFeature = false;

  projects: Project[] = [];
  selectedProject: Project;
  selectedQuota: QuotaDetails;
  projectControl: FormControl<Record<ComboboxControls.Select, string>>;
  projectNameCountMap: Record<string, number>;
  projectIdAndNameMap: Record<string, string>;

  constructor(
    private readonly _dialogRef: MatDialogRef<ProjectQuotaDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _projectService: ProjectService,
    private readonly _quotaService: QuotaService,
    private readonly _featureGateService: FeatureGateService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public readonly editQuota: QuotaDetails
  ) {}

  get quotaGroup(): FormGroup<QuotaGroupControls> {
    return this.form?.controls.quota;
  }

  get isQuotaUpdated(): boolean {
    if (!this.editQuota) {
      return this.form.controls.quota.dirty || this.gpuResources.dirty;
    }

    return (
      this._isEnablingAcceleratorAccounting ||
      !_.isEqual(this._comparableQuota(this.editQuota.quota), this._comparableQuota(this.quotaGroup.value))
    );
  }

  // The form always carries a control per limit, while the API omits limits that are unset and may
  // send an empty accelerator list. Drop unset entries from both sides so an untouched dialog never
  // compares as modified. An explicit "clear all limits" still differs, because the other side
  // holds a populated list.
  private _comparableQuota(quota: QuotaVariables): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(quota ?? {}).filter(
        ([, value]) => value !== null && value !== undefined && !(Array.isArray(value) && !value.length)
      )
    );
  }

  private get _isEnablingAcceleratorAccounting(): boolean {
    return this.canEnableAcceleratorAccounting && !!this.acceleratorAccountingControl?.value;
  }

  get isAcceleratorAccountingEnabled(): boolean {
    return !!this.editQuota?.acceleratorAccountingEnabled;
  }

  // Activation is irreversible, so the checkbox is only actionable while accounting is still off.
  get canEnableAcceleratorAccounting(): boolean {
    return this.hasAcceleratorQuotaFeature && !!this.editQuota && !this.isAcceleratorAccountingEnabled;
  }

  get isAcceleratorAccountingReady(): boolean {
    return this.editQuota?.status?.globalAcceleratorAccounting?.activationPhase === AcceleratorAccountingPhase.Ready;
  }

  // Limits may only be edited once accounting reports Ready.
  get canEditAccelerators(): boolean {
    return this.isAcceleratorAccountingEnabled && this.isAcceleratorAccountingReady;
  }

  get canRemoveAccelerators(): boolean {
    return this.isAcceleratorAccountingEnabled;
  }

  isGpuResourceRemovable(index: number): boolean {
    return this.canRemoveAccelerators && index < this.gpuResources.length - 1;
  }

  deleteGpuResource(index: number): void {
    this.gpuResources.removeAt(index);
  }

  ngOnInit(): void {
    this._setSelectedQuota();
    this._initForm();
    this._initGpuResourcesForm();
    this._getQuotas();
    this._getProjects();

    this._featureGateService.featureGates.pipe(takeUntil(this._unsubscribe)).subscribe(featureGates => {
      this.hasAcceleratorQuotaFeature = !!featureGates.kubeVirtAcceleratorQuota;
      this._applyAcceleratorAccountingState();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  projectDisplayFn(projectId: string): string {
    return this.projectIdAndNameMap?.[projectId] ?? '';
  }

  getObservable(): Observable<Record<string, never>> {
    if (this.form.invalid || this.gpuResources.invalid || !this.isQuotaUpdated) {
      return of(null);
    }

    const formValue = this.form.value as Quota;

    const quota: QuotaVariables = Object.fromEntries(Object.entries(formValue.quota).filter(([_, v]) => !!v));

    if (this.editQuota && !quota.accelerators) {
      quota.accelerators = [];
    }

    // Sent only while activating, so an ordinary edit never carries an activation request.
    if (this._isEnablingAcceleratorAccounting) {
      quota.enableAcceleratorAccounting = true;
    }

    const update$ = this._quotaService.updateQuota(this.selectedQuota?.name, quota);

    const create$ = this._quotaService.createQuota({...formValue, quota});

    const quotaName = this.selectedQuota?.subjectHumanReadableName ?? this.selectedProject?.name;

    return (this.selectedQuota ? update$ : create$).pipe(
      tap({
        next: () => {
          this._dialogRef.close();
          this._notificationService.success(
            `${this.selectedQuota ? 'Edited' : 'Created'} project quota for ${quotaName}`
          );
          this._quotaService.refreshQuotas();
        },
      })
    );
  }

  private _setSelectedQuota(): void {
    this.selectedQuota = this.editQuota;
  }

  private _getProjects(): void {
    this._projectService.allProjects
      .pipe(
        filter(projects => !_.isEqual(projects, this.projects)),
        takeUntil(this._unsubscribe)
      )
      .subscribe(projects => {
        this.projects = projects;
        this.projectNameCountMap = projects.reduce(
          (prev, curr) => ({...prev, [curr.name]: (prev[curr.name] || 0) + 1}),
          {}
        );

        this.projectIdAndNameMap = projects.reduce((prev, curr) => ({...prev, [curr.id]: curr.name}), {});

        if (this.editQuota) {
          this.selectedProject = projects.find(({id}) => id === this.editQuota.subjectName);
        }
      });
  }

  private _getQuotas(): void {
    this._quotaService.quotas
      .pipe(
        filter(quotas => !_.isEqual(quotas, this._quotas)),
        takeUntil(this._unsubscribe)
      )
      .subscribe(quotas => {
        this._quotas = quotas;
      });
  }

  private _initForm(): void {
    const {quota, subjectName} = this.editQuota ?? {};

    const {cpu, memory, storage} = quota ?? {};

    this.form = this._builder.group<QuotaFormControls>({
      quota: this._builder.group<QuotaGroupControls>(
        {
          cpu: this._builder.control(cpu),
          memory: this._builder.control(memory),
          storage: this._builder.control(storage),
          accelerators: this._builder.control<AcceleratorQuota[]>(undefined),
        },
        {validators: KmValidators.atLeastOneValidator}
      ),
      subjectKind: this._builder.control('project', {
        validators: Validators.required,
        nonNullable: true,
      }),
      subjectName: this._builder.control(subjectName ?? '', {
        validators: Validators.required,
        nonNullable: true,
      }),
    });

    this.projectControl = this._builder.control(null, {
      validators: Validators.required,
    });

    this._initSubscriptions();
  }

  private _initSubscriptions(): void {
    this.projectControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        map(({select}) => select),
        takeUntil(this._unsubscribe)
      )
      .subscribe(projectId => {
        this.form.controls.subjectName.setValue(this.projectControl.valid ? projectId : null);
      });

    // subjectName is project id
    this.form.controls.subjectName.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(projectId => {
      this.selectedProject = this.projects.find(({id}) => id === projectId);
      this.selectedQuota = this._quotas.find(({subjectName}) => subjectName === projectId);
    });

    this.quotaGroup.statusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._cdr.detectChanges());

    // Accelerators is excluded here: unlike CPU/Memory/Storage, 0 is a meaningful explicit
    // "deny this resource" value, not a stand-in for "unset".
    [this.quotaGroup.controls.cpu, this.quotaGroup.controls.memory, this.quotaGroup.controls.storage].forEach(
      control => {
        control.valueChanges
          .pipe(
            filter(value => value === 0),
            takeUntil(this._unsubscribe)
          )
          .subscribe(_ => control.setValue(null, {emitEvent: false}));
      }
    );
  }

  private _initGpuResourcesForm(): void {
    this.gpuResources = this._builder.array<FormGroup<GpuResourceControls>>([]);

    const resources = this.editQuota?.quota?.accelerators?.[0]?.resources ?? {};
    Object.entries(resources).forEach(([key, value]) => this._addGpuResource(key, Number(value)));
    this._addGpuResource();

    this.gpuResources.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addGpuResourceIfNeeded();
      this._revalidateAcceleratorKeys();
      this._updateAccelerators();
    });

    this._updateAccelerators();

    this.acceleratorAccountingControl = this._builder.control(this.isAcceleratorAccountingEnabled, {
      nonNullable: true,
    });

    this._applyAcceleratorAccountingState();
  }

  // Keeps the accelerator controls in step with the current activation state. The checkbox is
  // disabled unless activation is actually available, and the limit rows stay disabled until
  // accounting reports Ready so the form cannot produce a change KKP would reject.
  private _applyAcceleratorAccountingState(): void {
    if (!this.acceleratorAccountingControl) {
      return;
    }

    const toggle = (control: AbstractControl, enabled: boolean): void =>
      enabled ? control.enable({emitEvent: false}) : control.disable({emitEvent: false});

    toggle(this.acceleratorAccountingControl, this.canEnableAcceleratorAccounting);
    this.gpuResources.controls.forEach(row => {
      toggle(row.controls.key, this.canEditAccelerators);
      toggle(row.controls.value, this.canEditAccelerators);
    });
  }

  private _revalidateAcceleratorKeys(): void {
    this.gpuResources.controls.forEach(row =>
      row.controls.key.updateValueAndValidity({onlySelf: true, emitEvent: false})
    );
  }

  private _addGpuResourceIfNeeded(): void {
    const last = this.gpuResources.at(this.gpuResources.length - 1).getRawValue();
    if (last.key || last.value !== null) {
      this._addGpuResource();
    }
  }

  private _addGpuResource(key = '', value: number = null): void {
    this.gpuResources.push(
      this._builder.group<GpuResourceControls>({
        provider: this._builder.control({value: ACCELERATOR_PROVIDER, disabled: true}, {nonNullable: true}),
        key: this._builder.control(key, {
          validators: Validators.compose([AcceleratorFormValidators.nameFormat, AcceleratorFormValidators.uniqueName]),
          nonNullable: true,
        }),
        value: this._builder.control(value),
      })
    );
  }

  private _updateAccelerators(): void {
    const rows = this.gpuResources.getRawValue().filter(row => !!row.key && row.value !== null);
    const accelerators: AcceleratorQuota[] = rows.length
      ? [
          {
            provider: ACCELERATOR_PROVIDER,
            resources: Object.fromEntries(rows.map(row => [row.key, String(row.value)])),
          },
        ]
      : undefined;

    this.quotaGroup.controls.accelerators.setValue(accelerators, {emitEvent: false});
  }
}
