import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {nodesFake} from '../../../testing/fake-data/node.fake';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';

import {NodeListComponent} from './node-list.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('NodeComponent', () => {
  let fixture: ComponentFixture<NodeListComponent>;
  let component: NodeListComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            NodeListComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster details cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should hide remove button', () => {
    component.nodes = nodesFake();
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();

    const deRemoveButtons = fixture.debugElement.queryAll(By.css('.km-btn-remove-node-wrapper'));

    expect(deRemoveButtons[0]).not.toBeNull();
    expect(deRemoveButtons.length).toBe(2, 'should display 2 remove button 2');
  });

  it('should return correct css-classes', () => {
    const green = 'fa fa-circle green';
    const orange = 'fa fa-spin fa-circle-o-notch orange';

    const nodes = nodesFake();

    component.cluster = fakeDigitaloceanCluster();

    expect(component.getNodeHealthStatus(nodes[0], 0))
        .toEqual(
            {
              color: green,
              status: 'Running',
              class: 'statusRunning',
            },
            'should return classes for green icon');
    expect(component.getNodeHealthStatus(nodes[1], 0))
        .toEqual(
            {
              color: orange,
              status: 'Pending',
              class: 'statusWaiting',
            },
            'should return classes for orange icon');
  });
});
