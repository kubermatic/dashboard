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
import {PolicyTemplate} from '@app/shared/entity/kyverno';
import {Group} from '@app/shared/utils/member';
import {filter, Subject, switchMap, take, takeUntil} from 'rxjs';
import _ from 'lodash';
import {Cluster} from '@app/shared/entity/cluster';
import {RBACService} from '@app/core/services/rbac';
import {ViewTemplateDialogComponent, ViewTemplateDialogConfig} from './view-template/component';
import {AddPolicyDialogComponent, AddPolicyDialogConfig} from './add-policy-dialog/component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
} from '@app/shared/components/confirmation-dialog/component';

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
  @Input() isClusterRunning: boolean;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();
  dataSource = new MatTableDataSource<PolicyTemplate>();
  policyTemplates: PolicyTemplate[] = [];
  policiesWithBinding: PolicyTemplate[] = [];
  columns = ['name', 'category', 'namespace', 'view'];
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

  openAddPolicyDialog(): void {
    const noneBindingPolicies = this.policyTemplates.filter(template => !this.policyBindings[template.name]);
    const config: MatDialogConfig = {
      data: {
        projectID: this.projectID,
        clusterID: this.cluster.id,
        templates: noneBindingPolicies,
        namespaces: this.nameSpaces,
      } as AddPolicyDialogConfig,
    };
    this._matDialog
      .open(AddPolicyDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this._getPolicyBindings());
  }

  deletePolicyBinding(templateName: string): void {
    const bindingName = this.policyBindings[templateName].bindingName;
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Policy',
        message: `Delete <b>${_.escape(bindingName)}</b> policy `,
        confirmLabel: 'Delete',
      } as ConfirmationDialogConfig,
    };
    this._matDialog
      .open(ConfirmationDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(switchMap(_ => this._kyvernoService.deletePolicyBinding(bindingName, this.projectID, this.cluster.id)))
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${bindingName} policy`);
        delete this.policyBindings[templateName];
        this.policiesWithBinding = this.policiesWithBinding.filter(template => template.name !== templateName);
        this.dataSource.data = this.policiesWithBinding;
      });
  }

  viewTemplateSpec(template: PolicyTemplate): void {
    const config: MatDialogConfig = {
      data: {
        template: template,
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
          if (_.isEmpty(template.spec?.target?.clusterSelector)) {
            return true;
          }
          const labelKeys: string[] = Object.keys(template.spec.target.clusterSelector.matchLabels);
          const hasMatchedLabels = !!labelKeys.find(key =>
            this._isMatchedLabel(key, template.spec.target.clusterSelector.matchLabels[key])
          );
          return hasMatchedLabels;
        });
        this.policiesWithBinding = this.policyTemplates.filter(template => !!this.policyBindings[template.name]);
        this.dataSource.data = this.policiesWithBinding;
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
    if (!this.cluster.labels) {
      return false;
    }
    return !!this.cluster?.labels[key] && this.cluster?.labels[key] === value;
  }
}
