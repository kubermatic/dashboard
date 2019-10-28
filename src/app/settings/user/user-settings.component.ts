import {Component, OnDestroy, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {SettingsService} from '../../core/services/settings/settings.service';
import {UserSettings} from '../../shared/entity/MemberEntity';


@Component({
  selector: 'kubermatic-user-settings',
  templateUrl: 'user-settings.component.html',
  styleUrls: ['user-settings.component.scss'],
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  settings: UserSettings;       // Settings loaded from the API.
  localSettings: UserSettings;  // Local copy of settings, may be edited by the user.
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.settings)) {  // if something was changed elsewhere
        this.settings = settings;
        this.localSettings = settings;  // todo refresh only specific fields
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
