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

import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {KyvernoService} from '@app/core/services/kyverno';
import {NotificationService} from '@app/core/services/notification';
import {UserService} from '@app/core/services/user';
import {PolicyBinding, PolicyBindingSpec, PolicyTemplate} from '@app/shared/entity/kyverno';
import {Group} from '@app/shared/utils/member';
import {Subject, take, takeUntil} from 'rxjs';
import _ from 'lodash';
import {Cluster} from '@app/shared/entity/cluster';
import {RBACService} from '@app/core/services/rbac';
import {ViewTemplateDialogComponent, ViewTemplateDialogConfig} from './view-template/component';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

interface templatesBinding {
  bindingName: string;
  namespace: string;
}
@Component({
  selector: 'km-kyverno-cluster-policies-list',
  templateUrl: './template.html',
  styleUrl: './style.scss',
  standalone: false,
})
export class KyvernoClusterPoliciesListComponent implements OnInit, OnDestroy {
  @Input() projectID: string;
  @Input() cluster: Cluster;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();
  dataSource = new MatTableDataSource<PolicyTemplate>();
  policyTemplates: PolicyTemplate[] = [];
  columns = ['name', 'actions', 'namespace', 'view'];
  loadingTemplates = false;
  hasOwnerRole = false;
  nameSpaces: string[] = [];
  policyBindings: Record<string, templatesBinding> = {};

  constructor(
    private readonly _kyvernoService: KyvernoService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _rbacService: RBACService
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.direction = 'asc';
    this.sort.active = 'name';
    this._getPolicyBindings();
    this._getClusterNamespaces();

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => {
      if (user.isAdmin) {
        this.hasOwnerRole = true;
      } else {
        this.hasOwnerRole = user.projects.some(
          project => project.id === this.projectID && project.group === Group.Owner
        );
      }
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasBinding(templateName: string): boolean {
    return !!this.policyBindings[templateName]?.bindingName;
  }

  canCreate(template?: PolicyTemplate): boolean {
    if (!this.hasOwnerRole) {
      return false;
    }
    if (template.spec.namespacedPolicy) {
      return !this.policyBindings[template.name]?.namespace;
    }
    return false;
  }

  onEnforcedChange(event: MatSlideToggleChange, template: PolicyTemplate): void {
    this.loadingTemplates = true;
    if (event.checked) {
      const newBinding: PolicyBinding = {
        name: template.name,
        spec: {
          policyTemplateRef: {
            name: template.name,
          },
        } as PolicyBindingSpec,
      };

      if (template.spec.namespacedPolicy) {
        newBinding.spec.kyvernoPolicyNamespace = {
          name: this.policyBindings[template.name].namespace,
        };
      }
      this._kyvernoService
        .createPolicyBinding(newBinding, this.projectID, this.cluster.id)
        .pipe(take(1))
        .subscribe(pb => {
          this.policyBindings[template.name] = {
            bindingName: newBinding.name,
            namespace: newBinding.spec.kyvernoPolicyNamespace.name ?? '',
          };
          this._notificationService.success(`create the ${pb.name} policy binding`);
        });
    } else {
      const bindingName = this.policyBindings[template.name].bindingName;
      this._kyvernoService
        .deletePolicyBinding(bindingName, this.projectID, this.cluster.id)
        .pipe(take(1))
        .subscribe(_ => {
          this.policyBindings[template.name] = {
            bindingName: '',
            namespace: '',
          };
          this._notificationService.success(`Deleting the ${bindingName} policy binding`);
          this.loadingTemplates = false;
        });
    }
    this.loadingTemplates = false;
  }

  onNamespaceChange(namespace: string, template: string): void {
    if (this.policyBindings[template]) {
      this.policyBindings[template].namespace = namespace;
    }
  }

  viewTemplateSpec(template: PolicyTemplate): void {
    const config: MatDialogConfig = {
      data: {
        templateSpec: template.spec.policySpec,
        templatName: template.name,
      } as ViewTemplateDialogConfig,
    };
    this._matDialog.open(ViewTemplateDialogComponent, config);
  }

  private _getPolicyBindings(): void {
    this._kyvernoService
      .listPolicyBindings(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(bindings => {
        bindings.forEach(binding => {
          this.policyBindings[binding.spec.policyTemplateRef.name] = {
            bindingName: binding?.name,
            namespace: binding?.spec?.kyvernoPolicyNamespace?.name,
          };
        });
        this._getPolicyTemplates();
      });
  }

  private _getPolicyTemplates(): void {
    this._kyvernoService
      .listPolicyTemplates(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.policyTemplates = templates.filter(template => {
          if (_.isEmpty(template.spec.target.clusterSelector)) {
            return true;
          }
          const labelKeys: string[] = Object.keys(template.spec.target.clusterSelector.matchLabels);
          const hasMatchedLabels = !!labelKeys.find(key =>
            this._isMatchedLabel(key, template.spec.target.clusterSelector.matchLabels[key])
          );
          return hasMatchedLabels;
        });
        this.policyTemplates.forEach(template => {
          if (!this.policyBindings[template.name]) {
            this.policyBindings[template.name] = {
              bindingName: '',
              namespace: '',
            };
          }
        });
        this.dataSource.data = this.policyTemplates;
        this.loadingTemplates = false;
        this.loadingTemplates = false;
      });
  }

  private _getClusterNamespaces(): void {
    this._rbacService
      .getClusterNamespaces(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(namespaces => {
        this.nameSpaces = namespaces;
      });
  }

  private _isMatchedLabel(key: string, value: string): boolean {
    return this.cluster.labels[key] && this.cluster.labels[key] === value;
  }
}
