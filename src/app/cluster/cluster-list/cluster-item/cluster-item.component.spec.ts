import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {Auth, DatacenterService, HealthService, ProjectService} from '../../../core/services';
import {ClusterHealth} from '../../../shared/model/ClusterHealthConstants';
import {SharedModule} from '../../../shared/shared.module';
import {fakeAWSCluster, fakeAzureCluster, fakeBringyourownCluster, fakeDigitaloceanCluster, fakeHetznerCluster, fakeOpenstackCluster, fakeVSphereCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeBringyourownSeedDatacenter, fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeHealth} from '../../../testing/fake-data/health.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../../../testing/router-stubs';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {HealthMockService} from '../../../testing/services/health-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {ClusterHealthStatusComponent} from '../../cluster-health-status/cluster-health-status.component';
import {ClusterItemComponent} from './cluster-item.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule,
];

describe('ClusterItemComponent', () => {
  let fixture: ComponentFixture<ClusterItemComponent>;
  let component: ClusterItemComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ClusterItemComponent,
            ClusterHealthStatusComponent,
          ],
          providers: [
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: Auth, useClass: AuthMockService},
            {provide: HealthService, useClass: HealthMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
            {provide: ActivatedRoute, useClass: ActivatedRouteStub},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterItemComponent);
    component = fixture.componentInstance;
    component.nodeDC = fakeDigitaloceanDatacenter();
    component.seedDC = fakeBringyourownSeedDatacenter();
    component.projectID = fakeProject().id;
    component.health = fakeHealth();
    fixture.debugElement.injector.get(DatacenterService);
  });

  it('should create the cluster item cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should set km-status-running class odd', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.index = 1;
       fixture.detectChanges();
       tick();
       discardPeriodicTasks();

       expect(component.getClusterItemClass()).toBe(ClusterHealth.RUNNING + ' km-odd');
     }));

  it('should set path of cluster image', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();

       fixture.detectChanges();
       tick();
       discardPeriodicTasks();

       const de = fixture.debugElement.query(By.css('.km-provider-logo-digitalocean'));
       expect(de).toBeTruthy();
     }));

  it('should get correct provider string', () => {
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('digitalocean');

    component.cluster = fakeAWSCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('aws');

    component.cluster = fakeOpenstackCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('openstack');

    component.cluster = fakeHetznerCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('hetzner');

    component.cluster = fakeVSphereCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('vsphere');

    component.cluster = fakeAzureCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('azure');

    component.cluster = fakeBringyourownCluster();
    fixture.detectChanges();
    expect(component.getProvider()).toEqual('bringyourown');
  });

  it('should decide if name should be shortened', () => {
    let name = 'shortName';
    expect(component.getShortClusterName(name)).toEqual('shortName');

    name = 'thisNameIsNotShortEnough';
    expect(component.getShortClusterName(name)).toEqual('thisNameIsNo...');
  });

  it('should get datacenter', () => {
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    expect(component.getDatacenter()).toEqual('europe-west3-c');
  });
});
