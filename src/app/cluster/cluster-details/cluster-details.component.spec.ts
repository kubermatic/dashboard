import { clusterFake1 } from './../../testing/fake-data/cluster.fake';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteStub, RouterStub, RouterTestingModule } from './../../testing/router-stubs';

import { ClusterDetailsComponent } from './cluster-details.component';
import { CustomEventService } from './../../core/services/custom-event/custom-event.service';
import { Auth } from './../../core/services/auth/auth.service';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { ClusterHealthStatusComponent } from '../cluster-health-status/cluster-health-status.component';
import { NodeComponent } from './node/node.component';
import { ClusterSecretsComponent } from './cluster-secrets/cluster-secrets.component';
import { MatDialog } from '@angular/material';
import { CreateNodesService, DatacenterService } from '../../core/services/index';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';
import { LocalStorageService } from '../../core/services/local-storage/local-storage.service';
import { SSHKeysFake } from '../../testing/fake-data/sshkey.fake';
import { nodesFake } from '../../testing/fake-data/node.fake';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ClusterDetailsComponent', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ClusterDetailsComponent,
        ClusterHealthStatusComponent,
        ClusterSecretsComponent,
        NodeComponent
      ],
      providers: [
        {provide: ApiService, useClass: ApiMockService},
        CustomEventService,
        MatDialog,
        CreateNodesService,
        LocalStorageService,
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: '4k6txp5sq', seedDc: 'europe-west3-c'};
  });

  it('should create the cluster details cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should get cluster', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.cluster).toEqual(clusterFake1, 'should get cluster by api');
    discardPeriodicTasks();
  }));

  it('should get sshkeys', fakeAsync(() => {
    const sshkeys = SSHKeysFake.filter(key => {
      if (key.spec.clusters == null) {
        return false;
      }
      return key.spec.clusters.indexOf('4k6txp5sq') > -1;
    });
    component.ngOnInit();
    tick();
    expect(component.sshKeys).toEqual(sshkeys, 'should get sshkeys by api');
    discardPeriodicTasks();
  }));

  it('should get nodes', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.nodes).toEqual(nodesFake, 'should get sshkeys by api');
    discardPeriodicTasks();
  }));

  // it('should render template after requests', fakeAsync(() => {
  //   fixture.detectChanges();
  //   let de = fixture.debugElement.query(By.css('.cluster-detail-actions'));
  //   const spinnerDe = fixture.debugElement.query(By.css('.km-spinner'));
  //
  //   expect(de).toBeNull('element should not be rendered before requests');
  //   expect(spinnerDe).not.toBeNull('spinner should be rendered before requests');
  //
  //   tick();
  //   fixture.detectChanges();
  //
  //   de = fixture.debugElement.query(By.css('.cluster-detail-actions'));
  //   expect(de).not.toBeNull('element should be rendered after requests');
  // }));
});
