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

import {Component, Input, OnDestroy, OnInit, HostListener, ChangeDetectorRef} from '@angular/core';
import {ThemePalette} from '@angular/material/core';
import {debounceTime, take, takeUntil, map, filter} from 'rxjs/operators';
import {BehaviorSubject, Subject} from 'rxjs';
import {QuotaDetails, QuotaVariables} from '@shared/entity/quota';
import {getPercentage} from '@shared/utils/common';
import {Member} from '@shared/entity/member';
import {UserService} from '@core/services/user';
import {QuotaService} from '../service';

@Component({
  selector: 'km-quota-widget',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class QuotaWidgetComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounce = 500;
  private readonly _showDetails$ = new BehaviorSubject(false);
  private readonly _getPercentage = getPercentage;
  private _user: Member;

  @Input() projectId: string;
  @Input() showQuotaWidgetDetails = false;
  @Input() showAsCard = true;
  @Input() showIcon = true;
  @Input() showDetailsOnHover = true;
  @Input() showEmptyPlaceholder = false;
  quotaPercentage: QuotaVariables;
  quotaDetails: QuotaDetails;

  isLoading: boolean;

  showDetails$ = this._showDetails$.asObservable().pipe(debounceTime(this._debounce));

  @HostListener('mouseover') onMouseOver(): void {
    if (!this.showDetailsOnHover) return;

    this._showDetails$.next(true);
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    if (!this.showDetailsOnHover) return;

    this._showDetails$.next(false);
  }

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _userService: UserService,
    private readonly _quotaService: QuotaService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProgressBarAccent(percentage: number): ThemePalette {
    const warn = 90;
    if (percentage >= warn) return 'warn';

    const accent = 70;
    if (percentage >= accent) return 'accent';

    return 'primary';
  }

  private _initSubscriptions(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => {
      this._user = user;

      this._subscribeToQuotaDetails();
    });
  }

  private _subscribeToQuotaDetails(): void {
    const quota$ = this._user.isAdmin
      ? this._quotaService.quotas.pipe(map(quotas => quotas.find(({subjectName}) => subjectName === this.projectId)))
      : this._quotaService.getProjectQuota(this.projectId);

    quota$.pipe(filter(Boolean), takeUntil(this._unsubscribe)).subscribe(quotaDetails => {
      this.quotaDetails = quotaDetails;
      this._setQuotaPercentages(this.quotaDetails);
      this._cdr.detectChanges();
    });

    quota$.pipe(take(1)).subscribe(_ => {
      this.isLoading = false;
    });
  }

  private _setQuotaPercentages(quotaDetails: QuotaDetails): void {
    const quota = quotaDetails.quota;
    const usage = quotaDetails.status.globalUsage;

    const cpu = this._getPercentage(quota.cpu, usage.cpu) ?? 0;
    const memory = this._getPercentage(quota.memory, usage.memory) ?? 0;
    const storage = this._getPercentage(quota.storage, usage.storage) ?? 0;

    this.quotaPercentage = {cpu, memory, storage};
  }
}
