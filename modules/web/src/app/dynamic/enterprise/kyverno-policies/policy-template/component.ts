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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {KyvernoService} from '@app/core/services/kyverno';
import {PolicyTemplate, Scopes} from '@app/shared/entity/kyverno';
import {filter, Subject, switchMap, take, takeUntil} from 'rxjs';
import {AddPolicyTemplateDialogComponent, AddPolicyTemplateDialogConfig} from './add-template/component';
import {DialogActionMode} from '@app/shared/types/common';
import {UserService} from '@app/core/services/user';
import {Group} from '@app/shared/utils/member';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import _ from 'lodash';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
} from '@app/shared/components/confirmation-dialog/component';
import {NotificationService} from '@app/core/services/notification';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {ParamsService} from '@app/core/services/params';
import {HealthStatus, StatusIcon} from '@app/shared/utils/health-status';

enum PolicyTemplateStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}
@Component({
  selector: 'km-kyverno-policiy-template-list',
  templateUrl: './template.html',
  styleUrl: './style.scss',
  standalone: false,
})
export class KyvernoPoliciyTemplateListComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  projectID: string;
  mode = DialogActionMode;
  private readonly _unsubscribe = new Subject<void>();
  dataSource = new MatTableDataSource<PolicyTemplate>();
  policyTemplates: PolicyTemplate[] = [];
  columns = ['status', 'name', 'default', 'enforce', 'category', 'scope', 'actions'];
  loadingTemplates = false;
  hasOwnerRole = false;

  constructor(
    private _kyvernoService: KyvernoService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _ParamsService: ParamsService
  ) {}

  ngOnInit(): void {
    this.projectID = this._ParamsService.get('projectID');
    if (!this.projectID) {
      this.columns.shift();
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.direction = 'asc';
    this.sort.active = 'name';

    this.dataSource.sortingDataAccessor = (policyTemplate, property) => {
      switch (property) {
        case 'name':
          return policyTemplate.name;
        case 'category':
          return policyTemplate.spec.category;
        case 'scope':
          return policyTemplate.spec.visibility;
        default:
          return policyTemplate[property];
      }
    };

    this.getPolicyTemplates();

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

  isToggleDisabled(template: PolicyTemplate): boolean {
    return !this.hasOwnerRole || (this.hasOwnerRole && template.spec.visibility === Scopes.Global && !!this.projectID);
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  addTemplate(mode: DialogActionMode, template?: PolicyTemplate): void {
    const config: MatDialogConfig = {
      data: {
        mode,
        projectID: this.projectID,
        template,
      } as AddPolicyTemplateDialogConfig,
    };
    this._matDialog
      .open(AddPolicyTemplateDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this.getPolicyTemplates());
  }

  deleteTemplate(name: string): void {
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Policy Template',
        message: `Delete <b>${_.escape(name)}</b> policy template permanently?`,
        confirmLabel: 'Delete',
      } as ConfirmationDialogConfig,
    };
    this._matDialog
      .open(ConfirmationDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .pipe(switchMap(_ => this._kyvernoService.deletePolicyTemplate(name, this.projectID)))
      .subscribe(_ => {
        this.getPolicyTemplates();
        this._notificationService.success(`Deleting the ${name} policy template`);
      });
  }
  getPolicyTemplates(): void {
    this.loadingTemplates = true;
    this._kyvernoService
      .listPolicyTemplates(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.policyTemplates = templates;
        this.dataSource.data = templates;
        this.loadingTemplates = false;
      });
  }

  onDefaultChange(event: MatSlideToggleChange, template: PolicyTemplate): void {
    const patchedTemplate = template;
    patchedTemplate.spec.default = event.checked;
    this._patchPolicyTemplate(patchedTemplate);
  }

  onEnforcedChange(event: MatSlideToggleChange, template: PolicyTemplate): void {
    const patchedTemplate = template;
    patchedTemplate.spec.enforced = event.checked;
    this._patchPolicyTemplate(patchedTemplate);
  }

  getStatusIcon(policyTemplate: PolicyTemplate): HealthStatus {
    if (policyTemplate.spec.enforced || policyTemplate.spec.default) {
      return new HealthStatus(PolicyTemplateStatus.Active, StatusIcon.Running);
    }
    return new HealthStatus(PolicyTemplateStatus.Inactive, StatusIcon.Stopped);
  }

  private _patchPolicyTemplate(patchedTemplate: PolicyTemplate): void {
    this._kyvernoService
      .patchPolicyTemplate(patchedTemplate)
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Updated the ${patchedTemplate.name} policy template.`);
        this.getPolicyTemplates();
      });
  }
}
