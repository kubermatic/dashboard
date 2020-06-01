import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {ApiMockService} from '../../../testing/services/api-mock.service';

import {PacketNodeOptionsComponent} from './packet-node-options.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule, HttpClientModule];

describe('PacketNodeOptionsComponent', () => {
  let fixture: ComponentFixture<PacketNodeOptionsComponent>;
  let component: PacketNodeOptionsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [PacketNodeOptionsComponent],
      providers: [{provide: ApiService, useClass: ApiMockService}, NodeDataService, WizardService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PacketNodeOptionsComponent);
    component = fixture.componentInstance;
    component.nodeData = nodeDataFake();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
