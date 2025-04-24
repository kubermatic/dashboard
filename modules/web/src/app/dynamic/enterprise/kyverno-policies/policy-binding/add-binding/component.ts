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

import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ClusterService } from "@app/core/services/cluster";
import { KyvernoService } from "@app/core/services/kyverno";
import { NotificationService } from "@app/core/services/notification";
import { ProjectService } from "@app/core/services/project";
import { Cluster } from "@app/shared/entity/cluster";
import { PolicyBinding, PolicyBindingSpec, PolicyTargetSpec, PolicyTemplate, PolicyTemplateRef, ResourceSelector, Visibilities } from "@app/shared/entity/kyverno";
import { Project } from "@app/shared/entity/project";
import { DialogActionMode } from "@app/shared/types/common";
import { KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR } from "@app/shared/validators/others";
import { Observable, Subject, take, takeUntil } from "rxjs";

export interface AddPolicyBindingDialogConfig {
  mode: DialogActionMode;
  projectID: string;
  binding: PolicyBinding;
}

enum Controls {
  Name = 'name',
  NameSpace = 'namespace',
  Template = 'template',
  NamespacedPolicy = 'namespacedPolicy',
  Scope = 'scope',
  Projects = 'projects',
  AllProjects = 'allProjects',
  Clusters = 'clusters',
  AllClusters = 'allClusters'
}

@Component({
  selector: 'km-add-policy-binding-dialog',
  templateUrl: './template.html',
  standalone: false,
})
export class AddPolicyBindingDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  scopes = Object.values(Visibilities);
  form: FormGroup;
  mode: DialogActionMode;
  icon: string = this._config.mode === DialogActionMode.Edit ? 'km-icon-save' : 'km-icon-add';
  label: string = this._config.mode === DialogActionMode.Edit ? 'Save Changes' : 'Create';
  projects: Project[] = [];
  clusters: Cluster[] = [];
  allPolicyTemplates: PolicyTemplate[] = [];
  filteredTemplates: PolicyTemplate[] = [];
  constructor(
      private readonly _dialogRef: MatDialogRef<AddPolicyBindingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) private readonly _config: AddPolicyBindingDialogConfig,
      private readonly _builder: FormBuilder,
      private readonly _projectService: ProjectService,
      private readonly _clusterService: ClusterService,
      private _kyvernoService: KyvernoService,
      private readonly _notificationService: NotificationService,
    ) {}

  ngOnInit(): void {
    this._initForm();
    this.mode = this._config.mode
    this._kyvernoService.listPolicyTemplates(this._config.projectID).pipe(take(1)).subscribe(templates => {
      this.allPolicyTemplates = templates
      // check if we need to filter Templates based on Project
      this.filteredTemplates = templates
    });

    if (!this._config.projectID) {
      this._projectService.projects.pipe(take(1)).subscribe((projects: Project[]) => this.projects = projects)

    } else {

      this.scopes = [Visibilities.Project, Visibilities.Cluster]

      this._projectService.selectedProject.pipe(take(1)).subscribe((project: Project) => {
        this.projects = [project];
      })

      this._getProjectClusters(this._config.projectID);
      this.form.get(Controls.AllProjects).setValue(false)
      this.form.get(Controls.AllProjects).disable();
    }
    // this._cdr.detectChanges();

     this.form.get(Controls.AllProjects).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(value => {
      const projectsControl = this.form.get(Controls.Projects)
      if (value) {
        projectsControl.setValue([]);
        projectsControl.clearValidators();
        projectsControl.disable();
        this.form.get(Controls.AllClusters).setValue(true)
      } else {
        projectsControl.setValidators(Validators.required)
      }
      projectsControl.updateValueAndValidity();
    })

    this.form.get(Controls.AllClusters).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(value => {
      const clustersControl = this.form.get(Controls.Clusters)

      if (value) {
        clustersControl.setValue(null);
        clustersControl.clearValidators();
        clustersControl.disable();
      } else {
        clustersControl.enable()
        clustersControl.setValidators(Validators.required)
      }
      clustersControl.updateValueAndValidity();
    })
  }

  ngOnDestroy(): void {
      this._unsubscribe.next();
      this._unsubscribe.complete();
  }

  getObservable(): Observable<PolicyBinding> {
    if (this._config.mode === DialogActionMode.Edit) {
      return this._kyvernoService.patchPolicyBinding(this._getPolicyBindingObject());
    }
    return this._kyvernoService.createPolicyBinding(this._getPolicyBindingObject())
  }

  //
  //
  // add a new icon for kyverno on the side nav
  //
  //

  onNext(binding: PolicyBinding): void {
    this._dialogRef.close(binding);
    this._notificationService.success(`${this._config.mode === DialogActionMode.Edit ? 'Updated' : 'Created'} policy binding ${binding.name}`)
  }

  // check the function later
  projectDisplayFn(projectId: string[]): string {
    if (projectId?.length) {
      return projectId
        ?.map(id => {
          return this.projects.find(project => project.id === id)?.name;
        })
        .join(', ');
    }
    return '';
  }

  clusterDisplayFn(clusterId: string[]): string {
    if (clusterId?.length) {
      return clusterId
        ?.map(id => {
          return this.clusters.find(cluster => cluster.id === id)?.name;
        })
        .join(', ');
    }
    return '';
  }


  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._config.binding?.name ?? '', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,]),
      [Controls.NameSpace]: this._builder.control(this._config.binding?.namespace ?? '', Validators.required),
      [Controls.Template]: this._builder.control(this._config.binding?.spec?.policyTemplateRef?.name ?? '', Validators.required),
      [Controls.Scope]: this._builder.control(this._config.binding?.spec?.scope ?? this._config.projectID ? Visibilities.Project : Visibilities.Global, Validators.required),
      [Controls.NamespacedPolicy]: this._builder.control(this._config.binding?.spec?.namespacedPolicy ?? false),
      [Controls.Projects]: this._builder.control(this._config.binding?.spec?.target?.projects?.name ?? this._config.projectID ? [this._config.projectID] :[], Validators.required),
      [Controls.AllProjects]: this._builder.control(this._config.binding?.spec?.target?.projects?.selectAll ?? false),
      [Controls.Clusters]: this._builder.control(this._config.binding?.spec?.target?.clusters?.name ?? null, Validators.required),
      [Controls.AllClusters]: this._builder.control(this._config.binding?.spec?.target?.clusters?.selectAll ?? false),
    })

    if (this._config.mode === DialogActionMode.Edit) {
      this.form.get(Controls.Name).disable();
      this.form.get(Controls.NameSpace).disable();
    }
  }

  private _getProjectClusters(projectID: string): void {
    this._clusterService.projectClusterList(projectID).pipe(take(1)).subscribe(projectClusters => {
      this.clusters = projectClusters.clusters
      console.log(projectClusters);

    });
  }

  private _getPolicyBindingObject(): PolicyBinding {
    const policyBinding = {
      name: this.form.get(Controls.Name).value,
      namespace: this.form.get(Controls.NameSpace).value,
      spec: {
        policyTemplateRef: {
          name: this.form.get(Controls.Template).value
        } as PolicyTemplateRef,
        namespacedPolicy: this.form.get(Controls.NamespacedPolicy).value,
        scope: this.form.get(Controls.Scope).value,
        target: {
          projects: {
            selectAll: this.form.get(Controls.AllProjects).value
          },
          clusters: {
            selectAll: this.form.get(Controls.AllClusters).value
          } as ResourceSelector
        } as PolicyTargetSpec
      } as PolicyBindingSpec
    } as PolicyBinding

    if (this._config.projectID) {
      policyBinding.projectID = this._config.projectID
    }
    if (this.form.get(Controls.AllProjects).value) {
      policyBinding.spec.target.projects = {
        selectAll: this.form.get(Controls.AllProjects).value
      }
    } else {
      policyBinding.spec.target.projects = {
        name: this.form.get(Controls.Projects).value?.select
      }
    }

    if (this.form.get(Controls.AllClusters).value) {
      policyBinding.spec.target.clusters = {
        selectAll: this.form.get(Controls.AllClusters).value
      }
    } else {
      policyBinding.spec.target.clusters = {
        name: this.form.get(Controls.Clusters).value?.select
      }
    }

    return policyBinding
  }
}
