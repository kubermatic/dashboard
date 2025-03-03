// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Auth } from '@core/services/auth/service';
import { ClusterSpecService } from '@core/services/cluster-spec';
import { WizardService } from '@core/services/wizard/wizard';
import { SharedModule } from '@shared/module';
import { AuthMockService } from '@test/services/auth-mock';
import { EventRateLimitComponent } from './component';

describe('EventRateLimitComponent', () => {
  let fixture: ComponentFixture<EventRateLimitComponent>;
  let component: EventRateLimitComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [EventRateLimitComponent],
      providers: [WizardService, ClusterSpecService, {provide: Auth, useClass: AuthMockService}],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventRateLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create event-rate-limit component', () => {
    expect(component).toBeTruthy();
  });
});
