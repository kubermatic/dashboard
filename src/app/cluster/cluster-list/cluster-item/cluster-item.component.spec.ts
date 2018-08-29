import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick, discardPeriodicTasks } from '@angular/core/testing';
import { RouterTestingModule } from './../../../testing/router-stubs';
import { ClusterItemComponent } from './cluster-item.component';
import { Auth } from './../../../core/services/auth/auth.service';
import { AuthMockService } from '../../../testing/services/auth-mock.service';
import { DatacenterService, HealthService, ProjectService } from '../../../core/services';
import { DatacenterMockService } from './../../../testing/services/datacenter-mock.service';
import { HealthMockService } from '../../../testing/services/health-mock.service';
import { ProjectMockService } from './../../../testing/services/project-mock.service';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { fakeBringyourownSeedDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { fakeHealth } from '../../../testing/fake-data/health.fake';
import { fakeProject } from '../../../testing/fake-data/project.fake';
import { ClusterHealthStatusComponent } from '../../cluster-health-status/cluster-health-status.component';
import { ClusterHealth } from '../../../shared/model/ClusterHealthConstants';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ClusterItemComponent', () => {
  let fixture: ComponentFixture<ClusterItemComponent>;
  let component: ClusterItemComponent;
  let dcService: DatacenterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ClusterItemComponent,
        ClusterHealthStatusComponent
      ],
      providers: [
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: Auth, useClass: AuthMockService },
        { provide: HealthService, useClass: HealthMockService },
        { provide: ProjectService, useClass: ProjectMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterItemComponent);
    component = fixture.componentInstance;
    component.nodeDC = fakeDigitaloceanDatacenter;
    component.seedDC = fakeBringyourownSeedDatacenter;
    component.project = fakeProject;
    component.health = fakeHealth;
    dcService = fixture.debugElement.injector.get(DatacenterService);
  });

  it('should create the cluster item cmp', async(() => {
    expect(component).toBeTruthy();
  }));


  it('should set statusRunning class odd', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.index = 1;
    fixture.detectChanges();
    tick();
    discardPeriodicTasks();

    expect(component.getClusterItemClass()).toBe(ClusterHealth.RUNNING + ' odd');
  }));

  it('should set path of cluster image', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();

    fixture.detectChanges();
    tick();
    discardPeriodicTasks();

    const de = fixture.debugElement.query(By.css('.provider-logo'));
    expect(de.properties.src).toBe('/assets/images/clouds/digitalocean.png');
  }));
});
