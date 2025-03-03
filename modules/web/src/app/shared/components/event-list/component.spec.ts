// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {Event} from '@shared/entity/event';
import {SharedModule} from '@shared/module';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {EventListComponent} from './component';

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: SettingsService, useClass: SettingsMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should return true when there are events', () => {
    component.events = [{} as Event];
    expect(component.hasEvents()).toBeTruthy();
  });

  it('should return false when there are no events', () => {
    expect(component.hasEvents()).toBeFalsy();
  });
});
