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

import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import {Component, OnInit, OnDestroy, Inject, ChangeDetectorRef} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {takeUntil, filter, tap, distinctUntilChanged, map} from 'rxjs/operators';
import {Observable, Subject, of} from 'rxjs';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {QuotaService} from '../service';
import {QuotaVariables, QuotaDetails, Quota} from '@shared/entity/quota';
import {KmValidators} from '@shared/validators/validators';
import {ControlsOf} from '@shared/model/shared';
import {Project} from '@shared/entity/project';
import _ from 'lodash';
import {ComboboxControls} from '@shared/components/combobox/component';

enum Error {
  Required = 'required',
  AtLeastOneRequired = 'atLeastOneRequired',
  IncorrectProject = 'incorrectProject',
}

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

  form: FormGroup<ControlsOf<Quota>>;

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
    private readonly _cdr: ChangeDetectorRef,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public readonly editQuota: QuotaDetails
  ) {}

  get quotaGroup(): FormGroup<ControlsOf<QuotaVariables>> {
    return this.form?.controls.quota;
  }

  get isQuotaUpdated(): boolean {
    if (!this.editQuota) {
      return this.form.controls.quota.dirty;
    }

    return !_.isEqual(this.editQuota.quota, this.quotaGroup.value);
  }

  ngOnInit(): void {
    this._setSelectedQuota();
    this._initForm();
    this._getQuotas();
    this._getProjects();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  projectDisplayFn(projectId: string): string {
    return this.projectIdAndNameMap?.[projectId] ?? '';
  }

  getObservable(): Observable<Record<string, never>> {
    if (this.form.invalid || !this.isQuotaUpdated) {
      return of(null);
    }

    const formValue = this.form.value as Quota;

    const quota: QuotaVariables = Object.fromEntries(Object.entries(formValue.quota).filter(([_, v]) => !!v));

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

    this.form = this._builder.group<ControlsOf<Quota>>({
      quota: this._builder.group<ControlsOf<QuotaVariables>>(
        {
          cpu: this._builder.control(cpu),
          memory: this._builder.control(memory),
          storage: this._builder.control(storage),
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

    Object.values(this.quotaGroup.controls).forEach(control => {
      control.valueChanges
        .pipe(
          filter(value => value === 0),
          takeUntil(this._unsubscribe)
        )
        .subscribe(_ => control.setValue(null, {emitEvent: false}));
    });
  }
}
