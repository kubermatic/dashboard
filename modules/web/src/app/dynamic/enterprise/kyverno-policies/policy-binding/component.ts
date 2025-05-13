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
import {PolicyBinding, PolicyTemplate} from '@app/shared/entity/kyverno';
import {DialogActionMode} from '@app/shared/types/common';
import {Group} from '@app/shared/utils/member';
import {filter, Subject, switchMap, take, takeUntil} from 'rxjs';
import {AddPolicyBindingDialogComponent, AddPolicyBindingDialogConfig} from './add-binding/component';
import _ from 'lodash';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
} from '@app/shared/components/confirmation-dialog/component';
import {Cluster} from '@app/shared/entity/cluster';
@Component({
  selector: 'km-kyverno-policiy-binding-list',
  templateUrl: './template.html',
  styleUrl: './style.scss',
  standalone: false,
})
export class KyvernoPoliciyBindingListComponent implements OnInit, OnDestroy {
  @Input() projectID: string;
  @Input() cluster: Cluster;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  mode = DialogActionMode;
  private readonly _unsubscribe = new Subject<void>();
  dataSource = new MatTableDataSource<PolicyBinding>();
  policyBindings: PolicyBinding[] = [];
  policyTemplates: PolicyTemplate[] = [];
  columns = ['name', 'template', 'actions'];
  loadingBindings = false;
  hasOwnerRole = false;

  constructor(
    private readonly _kyvernoService: KyvernoService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.direction = 'asc';
    this.sort.active = 'name';
    this.getPolicyBindings();
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

  openBindingDialog(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this.projectID,
        clusterID: this.cluster.id,
        policyTemplates: this.policyTemplates,
      } as AddPolicyBindingDialogConfig,
    };

    this._matDialog
      .open(AddPolicyBindingDialogComponent, config)
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this.getPolicyBindings());
  }

  deleteBinding(bindingName: string): void {
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Policy Binding',
        message: `Delete <b>${_.escape(bindingName)}</b> policy binding permanently?`,
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
        this.getPolicyBindings();
        this._notificationService.success(`Deleting the ${bindingName} policy binding`);
      });
  }

  getPolicyBindings(): void {
    this.loadingBindings = true;
    this._kyvernoService
      .listPolicyBindings(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(bindings => {
        this.dataSource.data = bindings;
        this.policyBindings = bindings;
        this.loadingBindings = false;
      });
  }

  getPolicyTemplates(): void {
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
            this.isMatchedLabel(key, template.spec.target.clusterSelector.matchLabels[key])
          );
          return hasMatchedLabels;
        });
      });
  }

  isMatchedLabel(key: string, value: string): boolean {
    return this.cluster.labels[key] && this.cluster.labels[key] === value;
  }
}
