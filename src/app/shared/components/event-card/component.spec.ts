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
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {UserMockService} from '@test/services/user-mock';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {EventCardComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('EventCardComponent', () => {
  let fixture: ComponentFixture<EventCardComponent>;
  let component: EventCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      providers: [{provide: UserService, useClass: UserMockService}],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});