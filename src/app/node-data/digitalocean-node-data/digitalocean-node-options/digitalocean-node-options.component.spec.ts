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
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {DigitaloceanNodeOptionsComponent} from './digitalocean-node-options.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule, HttpClientModule];

describe('DigitaloceanNodeOptionsComponent', () => {
  let fixture: ComponentFixture<DigitaloceanNodeOptionsComponent>;
  let component: DigitaloceanNodeOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [DigitaloceanNodeOptionsComponent],
      providers: [NodeDataService, WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanNodeOptionsComponent);
    component = fixture.componentInstance;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the digitalocean options cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should have valid form when initializing', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should call getDoOptionsData method', () => {
    component.form.controls.ipv6.patchValue(true);
    fixture.detectChanges();

    expect(component.getDoOptionsData()).toEqual({
      spec: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: true,
          monitoring: false,
          tags: [],
        },
      },
      valid: true,
    });
  });
});
