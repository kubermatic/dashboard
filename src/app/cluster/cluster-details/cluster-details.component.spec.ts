import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { DebugElement } from '@angular/core/src/debug/debug_node';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;

import { ClusterDetailsComponent } from './cluster-details.component';
import { ClusterHealthStatusComponent } from '../cluster-health-status/cluster-health-status.component';
import { ClusterSecretsComponent } from './cluster-secrets/cluster-secrets.component';
import { NodeListComponent } from './node-list/node-list.component';

import { ApiService, ProjectService, DatacenterService, InitialNodeDataService, HealthService, UserService } from '../../core/services';
import { AppConfigService } from '../../app-config.service';
import { Auth } from './../../core/services/auth/auth.service';

import { SharedModule } from '../../shared/shared.module';
import { ActivatedRouteStub, RouterStub, RouterTestingModule } from './../../testing/router-stubs';

import { AuthMockService } from '../../testing/services/auth-mock.service';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { HealthMockService } from '../../testing/services/health-mock.service';
import { UserMockService } from '../../testing/services/user-mock.service';
import { asyncData } from '../../testing/services/api-mock.service';

import { fakeDigitaloceanCluster } from './../../testing/fake-data/cluster.fake';
import { fakeSSHKeys } from '../../testing/fake-data/sshkey.fake';
import { nodesFake } from '../../testing/fake-data/node.fake';
import { fakeDigitaloceanDatacenter } from '../../testing/fake-data/datacenter.fake';
import { fakeUserGroupConfig } from '../../testing/fake-data/userGroupConfig.fake';

describe('ClusterDetailsComponent', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;
  let spinner: DebugElement;
  let clusterDetailActions: DebugElement;

  let getClusterSpy: Spy;
  let getClusterUpgradesSpy: Spy;
  let getClusterNodesSpy: Spy;
  let getSSHKeysSpy: Spy;
  let getDatacenterSpy: Spy;
  let getKubeconfigURL: Spy;

  let apiMock;

  beforeEach(async(() => {
    apiMock = jasmine.createSpyObj('ApiService', ['getCluster', 'getClusterUpgrades', 'getClusterNodes', 'getSSHKeys', 'getKubeconfigURL']);
    getClusterSpy = apiMock.getCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    getClusterUpgradesSpy = apiMock.getClusterUpgrades.and.returnValue(asyncData([]));
    getClusterNodesSpy = apiMock.getClusterNodes.and.returnValue(asyncData(nodesFake()));
    getSSHKeysSpy = apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));
    getKubeconfigURL = apiMock.getKubeconfigURL.and.returnValue(asyncData(''));

    const datacenterMock = jasmine.createSpyObj('DatacenterService', ['getDataCenter']);
    getDatacenterSpy = datacenterMock.getDataCenter.and.returnValue(asyncData(fakeDigitaloceanDatacenter()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule
      ],
      declarations: [
        ClusterDetailsComponent,
        ClusterHealthStatusComponent,
        ClusterSecretsComponent,
        NodeListComponent
      ],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useValue: datacenterMock },
        { provide: Auth, useClass: AuthMockService },
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: HealthService, useClass: HealthMockService },
        { provide: UserService, useClass: UserMockService },
        MatDialog,
        AppConfigService,
        InitialNodeDataService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = { clusterName: '4k6txp5sq', seedDc: 'europe-west3-c' };

    spinner = fixture.debugElement.query(By.css('.km-spinner'));
    clusterDetailActions = fixture.debugElement.query(By.css('.cluster-detail-actions'));
  });

  it('should create the cluster details cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should get cluster', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const expectedCluster = fakeDigitaloceanCluster();
    // @ts-ignore
    expectedCluster.creationTimestamp = jasmine.any(Date);

    expect(component.cluster).toEqual(expectedCluster, 'should get cluster by api');
    discardPeriodicTasks();
  }));

  /* it('should get sshkeys', fakeAsync(() => {
    const sshkeys = fakeSSHKeys().filter(key => {
      if (key.spec.clusters == null) {
        return false;
      }
      return key.spec.clusters.indexOf('4k6txp5sq') > -1;
    });
    fixture.detectChanges();
    tick();

    // @ts-ignore
    sshkeys[0].creationTimestamp = jasmine.any(Date);

    expect(component.sshKeys).toEqual(sshkeys, 'should get sshkeys by api');
    discardPeriodicTasks();
  }));*/

  it('should get nodes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const expectedNodes = nodesFake();
    // @ts-ignore
    expectedNodes[0].creationTimestamp = jasmine.any(Date);
    // @ts-ignore
    expectedNodes[1].creationTimestamp = jasmine.any(Date);

    expect(component.nodes).toEqual(expectedNodes, 'should get nodes by api');

    discardPeriodicTasks();
  }));

  it('should render template after requests', fakeAsync(() => {
    fixture.detectChanges();
    let de = fixture.debugElement.query(By.css('.cluster-detail-actions'));
    const spinnerDe = fixture.debugElement.query(By.css('.km-spinner'));

    expect(de).toBeNull('element should not be rendered before requests');
    expect(spinnerDe).not.toBeNull('spinner should be rendered before requests');

    component.userGroupConfig = fakeUserGroupConfig();
    component.userGroup = 'owners';
    tick();
    fixture.detectChanges();

    de = fixture.debugElement.query(By.css('.cluster-detail-actions'));
    expect(de).not.toBeNull('element should be rendered after requests');

    discardPeriodicTasks();
  }));

  it('should show upgrade link', fakeAsync(() => {
    getClusterUpgradesSpy = apiMock.getClusterUpgrades.and.returnValue(asyncData([
      {
        version: '1.8.5',
        allowedVersions: ['1.8.5'],
        default: false
      },
      {
        version: '1.8.6',
        allowedVersions: ['1.8.6'],
        default: false
      }
    ]));
    fixture.detectChanges();
    tick();
    expect(component.updatesAvailable).toEqual(true, 'Updates should be available');
    expect(component.downgradesAvailable).toEqual(false, 'Downgrades should not be available');
    discardPeriodicTasks();
  }));

  it('should not show upgrade or downgrade link', fakeAsync(() => {
    getClusterUpgradesSpy = apiMock.getClusterUpgrades.and.returnValue(asyncData([
      {
        version: '1.8.5',
        allowedVersions: ['1.8.5'],
        default: false
      }
    ]));
    fixture.detectChanges();
    tick();
    expect(component.updatesAvailable).toEqual(false, 'Updates should not be available');
    expect(component.downgradesAvailable).toEqual(false, 'Downgrades should not be available');
    discardPeriodicTasks();
  }));

  it('should show downgrade link', fakeAsync(() => {
    getClusterUpgradesSpy = apiMock.getClusterUpgrades.and.returnValue(asyncData([
      {
        version: '1.8.5',
        allowedVersions: ['1.8.5'],
        default: false
      },
      {
        version: '1.8.4',
        allowedVersions: ['1.8.4'],
        default: false
      }
    ]));
    fixture.detectChanges();
    tick();
    expect(component.updatesAvailable).toEqual(false, 'Updates should not be available');
    expect(component.downgradesAvailable).toEqual(true, 'Downgrades should be available');
    discardPeriodicTasks();
  }));

  it('should show downgrade and update link', fakeAsync(() => {
    getClusterUpgradesSpy = apiMock.getClusterUpgrades.and.returnValue(asyncData([
      {
        version: '1.8.5',
        allowedVersions: ['1.8.5'],
        default: false
      },
      {
        version: '1.8.4',
        allowedVersions: ['1.8.4'],
        default: false
      },
      {
        version: '1.8.6',
        allowedVersions: ['1.8.6'],
        default: false
      }
    ]));
    fixture.detectChanges();
    tick();
    expect(component.updatesAvailable).toEqual(true, 'Updates should be available');
    expect(component.downgradesAvailable).toEqual(true, 'Downgrades should be available');
    discardPeriodicTasks();
  }));
});
