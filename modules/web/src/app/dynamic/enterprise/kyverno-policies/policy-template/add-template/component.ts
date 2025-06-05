//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0")
//                   Copyright © 2025 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {KyvernoService} from '@app/core/services/kyverno';
import {NotificationService} from '@app/core/services/notification';
import {ProjectService} from '@app/core/services/project';
import {
  PolicySeverity,
  PolicyTemplate,
  PolicyTemplateSpec,
  PolicyTemplateTarget,
  Scopes,
} from '@app/shared/entity/kyverno';
import {Project} from '@app/shared/entity/project';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import * as y from 'js-yaml';
import {Observable, Subject, take} from 'rxjs';

export interface AddPolicyTemplateDialogConfig {
  mode: PolicyTemplateDialogMode;
  projectID: string;
  template?: PolicyTemplate;
}

export enum PolicyTemplateDialogMode {
  Add = 'Add',
  Edit = 'Edit',
  Copy = 'Copy',
}

enum Controls {
  Name = 'name',
  Title = 'title',
  Description = 'description',
  Category = 'category',
  Severity = 'severity',
  Scope = 'scope',
  Project = 'project',
  Default = 'default',
  Enforced = 'enforced',
  NamespacedPolicy = 'namespacedPolicy',
  ProjectSelector = 'projectSelector',
  ClusterSelector = 'clusterSelector',
}

@Component({
  selector: 'km-add-policy-template-dialog',
  templateUrl: './template.html',
  standalone: false,
})
export class AddPolicyTemplateDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  scopes = Scopes;
  severityOptions = Object.values(PolicySeverity);
  form: FormGroup;
  policySpec = '';
  isYamlEditorValid = true;
  mode: PolicyTemplateDialogMode;
  project: Project;
  projectsLabels: Record<string, string>;
  clustersLabels: Record<string, string>;

  get icon(): string {
    switch (this._config.mode) {
      case PolicyTemplateDialogMode.Add:
      case PolicyTemplateDialogMode.Copy:
        return 'km-icon-add';
      case PolicyTemplateDialogMode.Edit:
        return 'km-icon-save';
    }
  }

  get label(): string {
    switch (this._config.mode) {
      case PolicyTemplateDialogMode.Add:
      case PolicyTemplateDialogMode.Copy:
        return 'Create Template';
      case PolicyTemplateDialogMode.Edit:
        return 'Edit Template';
    }
  }
  get dialogTitle(): string {
    switch (this._config.mode) {
      case PolicyTemplateDialogMode.Add:
      case PolicyTemplateDialogMode.Copy:
        return 'Create Policy Template';
      case PolicyTemplateDialogMode.Edit:
        return 'Edit Policy Template';
    }
  }

  constructor(
    private readonly _dialogRef: MatDialogRef<AddPolicyTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddPolicyTemplateDialogConfig,
    private readonly _builder: FormBuilder,
    private readonly _kyvernoService: KyvernoService,
    private readonly _notificationService: NotificationService,
    private readonly _projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.projectsLabels =
      (this._config.template?.spec?.target?.projectSelector?.matchLabels as Record<string, string>) ?? {};
    this.clustersLabels =
      (this._config.template?.spec?.target?.clusterSelector?.matchLabels as Record<string, string>) ?? {};

    this._initForm();
    this.mode = this._config.mode;
    if (this.mode === PolicyTemplateDialogMode.Edit) {
      this.form.get(Controls.Name).disable();
      this.policySpec = y.dump(this._config.template?.spec?.policySpec);
    }

    if (this.mode === PolicyTemplateDialogMode.Copy) {
      this.form.get(Controls.Name).setValue('');
      this.policySpec = y.dump(this._config.template?.spec?.policySpec);
    }

    if (!this._config.projectID) {
      this.form.get(Controls.Scope).setValue(Scopes.Global);
      this.form.get(Controls.Scope).disable();
    } else {
      this._projectService.selectedProject.pipe(take(1)).subscribe((project: Project) => {
        this.project = project;
      });
      this.form.get(Controls.Scope).setValue(Scopes.Project);
      this.form.get(Controls.Project).setValue(this.project?.name);
      this.form.get(Controls.Project).disable();
      this.form.get(Controls.Scope).disable();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<PolicyTemplate> {
    if (this._config.mode === PolicyTemplateDialogMode.Edit) {
      return this._kyvernoService.patchPolicyTemplate(this._getPolicyTemplateObject());
    }
    return this._kyvernoService.createPolicyTemplate(this._getPolicyTemplateObject());
  }

  onNext(template: PolicyTemplate): void {
    this._dialogRef.close(template);
    this._notificationService.success(
      `${this._config.mode === PolicyTemplateDialogMode.Edit ? 'Updated' : 'Created'} policy template ${template.name}`
    );
  }

  isValidYaml(valid: boolean): void {
    this.isYamlEditorValid = valid;
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._config.template?.name ?? '', [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Controls.Title]: this._builder.control(this._config.template?.spec?.title ?? '', Validators.required),
      [Controls.Description]: this._builder.control(
        this._config.template?.spec?.description ?? '',
        Validators.required
      ),
      [Controls.Category]: this._builder.control(this._config.template?.spec?.category ?? ''),
      [Controls.Severity]: this._builder.control(this._config.template?.spec?.severity ?? ''),
      [Controls.Scope]: this._builder.control(this._config.template?.spec?.visibility ?? '', Validators.required),
      [Controls.Project]: this._builder.control(this.project?.name),
      [Controls.Default]: this._builder.control(this._config.template?.spec?.default ?? false),
      [Controls.Enforced]: this._builder.control(this._config.template?.spec?.enforced ?? false),
      [Controls.NamespacedPolicy]: this._builder.control(this._config.template?.spec?.namespacedPolicy ?? false),
      [Controls.ProjectSelector]: this._builder.control(''),
      [Controls.ClusterSelector]: this._builder.control(''),
    });
  }

  private _getPolicyTemplateObject(): PolicyTemplate {
    for (const key in this.projectsLabels) {
      if (!this.projectsLabels[key]) {
        delete this.projectsLabels[key];
      }
    }
    for (const key in this.clustersLabels) {
      if (!this.clustersLabels[key]) {
        delete this.clustersLabels[key];
      }
    }
    const policyTemplate = {
      name: this.form.get(Controls.Name).value,
      spec: {
        title: this.form.get(Controls.Title).value,
        description: this.form.get(Controls.Description).value,
        category: this.form.get(Controls.Category).value,
        severity: this.form.get(Controls.Severity).value,
        visibility: this.form.get(Controls.Scope).value,
        projectID: this.project?.id ?? '',
        default: this.form.get(Controls.Default).value,
        enforced: this.form.get(Controls.Enforced).value,
        namespacedPolicy: this.form.get(Controls.NamespacedPolicy).value,
        target: {
          projectSelector: {
            matchLabels: this.projectsLabels,
          },
          clusterSelector: {
            matchLabels: this.clustersLabels,
          },
        } as PolicyTemplateTarget,
      } as PolicyTemplateSpec,
    } as PolicyTemplate;

    if (this.form.get(Controls.Scope).value === Scopes.Project) {
      delete policyTemplate.spec.target.projectSelector;
    }

    if (this.form.get(Controls.Scope).value === Scopes.Global) {
      policyTemplate.spec.projectID = '';
    }

    try {
      policyTemplate.spec.policySpec = y.load(this.policySpec) as object;
    } catch (error) {
      this.isYamlEditorValid = false;
    }

    return policyTemplate;
  }
}
