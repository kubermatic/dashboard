//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2025 Kubermatic GmbH
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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {PolicyTemplate, PolicyTemplateSpec, Visibilities} from '@app/shared/entity/kyverno';
import {DialogActionMode} from '@app/shared/types/common';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {Observable, Subject, take} from 'rxjs';
import * as y from 'js-yaml';
import {KyvernoService} from '@app/core/services/kyverno';
import {NotificationService} from '@app/core/services/notification';
import {ProjectService} from '@app/core/services/project';
import {Project} from '@app/shared/entity/project';

export interface AddPolicyTemplateDialogConfig {
  mode: DialogActionMode;
  projectID: string;
  template?: PolicyTemplate;
}

enum Controls {
  Name = 'name',
  Title = 'title',
  Description = 'description',
  Visibility = 'visibility',
  Project = 'project',
  Default = 'default',
  Enforced = 'enforced',
}

@Component({
  selector: 'km-add-policy-template-dialog',
  templateUrl: './template.html',
  standalone: false,
})
export class AddPolicyTemplateDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  readonly visibilities = Object.values(Visibilities);
  form: FormGroup;
  policySpec = '';
  isYamlEditorValid = true;
  mode: DialogActionMode;
  icon: string = this._config.mode === DialogActionMode.Edit ? 'km-icon-save' : 'km-icon-add';
  label: string = this._config.mode === DialogActionMode.Edit ? 'Save Changes' : 'Create';
  projects: Project[] = [];

  constructor(
    private readonly _dialogRef: MatDialogRef<AddPolicyTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddPolicyTemplateDialogConfig,
    private readonly _builder: FormBuilder,
    private _kyvernoService: KyvernoService,
    private readonly _notificationService: NotificationService,
    private readonly _projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this.mode = this._config.mode;
    if (!this._config.projectID) {
      this._projectService.projects.pipe(take(1)).subscribe((projects: Project[]) => (this.projects = projects));
    } else {
      this._projectService.selectedProject.pipe(take(1)).subscribe((project: Project) => {
        this.projects = [project];
        // check to disable the project
        this.form.get(Controls.Project).setValue(project.id);
        this.form.get(Controls.Visibility).setValue(Visibilities.Project);
        this.form.get(Controls.Visibility).disable();
      });
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<PolicyTemplate> {
    if (this._config.mode === DialogActionMode.Edit) {
      return this._kyvernoService.patchPolicyTemplate(this._getPolicyTemplateObject());
    }
    return this._kyvernoService.createPolicyTemplate(this._getPolicyTemplateObject());
  }

  onNext(template: PolicyTemplate): void {
    this._dialogRef.close(template);
    this._notificationService.success(
      `${this._config.mode === DialogActionMode.Edit ? 'Updated' : 'Created'} policy template ${template.name}`
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
      [Controls.Visibility]: this._builder.control(this._config.template?.spec?.visibility ?? '', Validators.required),
      [Controls.Project]: this._builder.control(this._config.template?.spec?.projectID ?? ''),
      [Controls.Default]: this._builder.control(this._config.template?.spec?.default ?? false),
      [Controls.Enforced]: this._builder.control(this._config.template?.spec?.enforced ?? false),
    });
    if (this._config.mode === DialogActionMode.Edit) {
      this.form.get(Controls.Name).disable();
      this.policySpec = y.dump({policySpec: this._config.template?.spec?.policySpec});
    }
  }

  private _getPolicyTemplateObject(): PolicyTemplate {
    const policyTemplate = {
      name: this.form.get(Controls.Name).value,
      spec: {
        title: this.form.get(Controls.Title).value,
        description: this.form.get(Controls.Description).value,
        visibility: this.form.get(Controls.Visibility).value,
        projectID: this.form.get(Controls.Project).value,
        default: this.form.get(Controls.Default).value,
        enforced: this.form.get(Controls.Enforced).value,
      } as PolicyTemplateSpec,
    } as PolicyTemplate;

    try {
      policyTemplate.spec.policySpec = y.load(this.policySpec) as object;
    } catch (error) {
      this.isYamlEditorValid = false;
    }

    return policyTemplate;
  }
}
