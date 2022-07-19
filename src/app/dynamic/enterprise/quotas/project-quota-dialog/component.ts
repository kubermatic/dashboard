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

import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Component, OnInit, OnDestroy, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {takeUntil, filter, tap} from 'rxjs/operators';
import {Observable, Subject, of} from 'rxjs';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {QuotaService} from '@core/services/quota';
import {QuotaVariables, QuotaDetails, Quota} from '@shared/entity/quota';
import {KmValidators} from '@shared/validators/validators';
import {ControlsOf} from '@shared/model/shared';
import {Project} from '@shared/entity/project';

enum Error {
  Required = 'required',
  AtLeastOneRequired = 'atLeastOneRequired',
}

@Component({
  selector: 'km-quota-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ProjectQuotaDialogComponent implements OnInit, OnDestroy {
  private _unsubscribe = new Subject<void>();
  private _quotas: QuotaDetails[] = [];

  readonly Error = Error;

  form: FormGroup<ControlsOf<Quota>>;

  projects: Project[] = [];
  selectedProject: Project;
  selectedQuota: QuotaDetails;

  constructor(
    private readonly _dialogRef: MatDialogRef<ProjectQuotaDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _projectService: ProjectService,
    private readonly _quotaService: QuotaService,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public readonly editQuota: QuotaDetails
  ) {}

  get quotaGroup(): FormGroup<ControlsOf<QuotaVariables>> {
    return this.form?.controls.quota;
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

  resetSubjectNameControl(): void {
    this.form.controls.subjectName.reset();
  }

  getObservable(): Observable<Record<string, never>> {
    if (this.form.invalid) return of(null);

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
    this._projectService.allProjects.pipe(takeUntil(this._unsubscribe)).subscribe(projects => {
      this.projects = projects;

      if (this.editQuota) {
        this.selectedProject = projects.find(({id}) => id === this.editQuota.subjectName);
      } else {
        this.form.controls.subjectName.enable();
      }
    });
  }

  private _getQuotas(): void {
    this._quotaService.quotas.pipe(takeUntil(this._unsubscribe)).subscribe(quotas => {
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
      subjectName: this._builder.control(
        {value: subjectName, disabled: true},
        {validators: Validators.required, nonNullable: true}
      ),
    });

    this._initSubscriptions();
  }

  private _initSubscriptions(): void {
    // subjectName is project id
    this.form.controls.subjectName.valueChanges
      .pipe(
        filter(projectId => !!projectId),
        takeUntil(this._unsubscribe)
      )
      .subscribe(projectId => {
        this.selectedProject = this.projects.find(({id}) => id === projectId);
        this.selectedQuota = this._quotas.find(({subjectName}) => subjectName === projectId);
      });
  }
}
