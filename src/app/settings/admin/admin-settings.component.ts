import {Component, OnDestroy, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, takeUntil} from 'rxjs/operators';

import {HistoryService} from '../../core/services/history/history.service';
import {SettingsService} from '../../core/services/settings/settings.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {AdminSettings} from '../../shared/entity/AdminSettings';
import {MemberEntity} from '../../shared/entity/MemberEntity';

@Component({
  selector: 'kubermatic-admin-settings',
  templateUrl: 'admin-settings.component.html',
  styleUrls: ['admin-settings.component.scss'],
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  user: MemberEntity;
  settings: AdminSettings;     // Local settings copy. User can edit it.
  apiSettings: AdminSettings;  // Original settings from the API. Cannot be edited by the user.
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _settingsService: SettingsService, private readonly _historyService: HistoryService) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings) {
          NotificationActions.success('Successfully applied external settings update');
        }
        this.apiSettings = settings;
        this.settings = _.cloneDeep(this.apiSettings);
      }
    });

    this._settingsChange.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._settingsService.patchAdminSettings(this.settings)))
        .subscribe(settings => {
          this.apiSettings = settings;
          this.settings = _.cloneDeep(this.apiSettings);
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  // TODO: Send only part of the data that has changed.
  onSettingsChange(): void {
    this._settingsChange.next();
  }

  resetDefaults(): void {
    this.settings = this._settingsService.defaultAdminSettings;
    this.onSettingsChange();
  }

  goBack(): void {
    this._historyService.goBack('/projects');
  }

  isEqual(a: any, b: any): boolean {
    return _.isEqual(a, b);
  }
}
