// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';

import {SharedModule} from '../../../shared/shared.module';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {Auth} from '../../services/index';
import {HelpPanelComponent} from './help-panel.component';

const modules: any[] = [BrowserModule, HttpClientModule, RouterTestingModule, BrowserAnimationsModule, SharedModule];

describe('HelpPanelComponent', () => {
  let fixture: ComponentFixture<HelpPanelComponent>;
  let component: HelpPanelComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [HelpPanelComponent],
      providers: [MatDialog, {provide: Auth, useClass: AuthMockService}],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpPanelComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
    expect(component).toBeTruthy();
  }));
});
