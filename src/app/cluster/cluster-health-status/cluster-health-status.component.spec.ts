import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from './../../testing/router-stubs';
import { ClusterHealthStatusComponent } from './cluster-health-status.component';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { fakeBringyourownSeedDatacenter } from '../../testing/fake-data/datacenter.fake';
import { fakeHealth } from '../../testing/fake-data/health.fake';
import { fakeProject } from '../../testing/fake-data/project.fake';
import { HealthService, ProjectService } from '../../core/services';
import { ClusterHealth } from '../../shared/model/ClusterHealthConstants';
import { HealthMockService } from '../../testing/services/health-mock.service';
import { ProjectMockService } from '../../testing/services/project-mock.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ClusterHealthStatusComponent', () => {
  let fixture: ComponentFixture<ClusterHealthStatusComponent>;
  let component: ClusterHealthStatusComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ClusterHealthStatusComponent
      ],
      providers: [
        { provide: HealthService, useClass: HealthMockService },
        { provide: ProjectService, useClass: ProjectMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterHealthStatusComponent);
    component = fixture.componentInstance;
    component.datacenter = fakeBringyourownSeedDatacenter();
    component.cluster = fakeDigitaloceanCluster();
    component.health = fakeHealth();
    component.projectID = fakeProject().id;
  });

  it('should create the cluster health status cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should set class to circle', () => {
    component.healthStatus = ClusterHealth.RUNNING;
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.css('.green'));
    expect(de).not.toBeNull('should have class green');
  });

  it('should get HealthStatusColor', () => {
    fixture.detectChanges();

    component.healthStatus = ClusterHealth.RUNNING;
    expect(component.getHealthStatusColor()).toBe(component.green, 'should be green color');

    component.healthStatus = ClusterHealth.DELETING;
    expect(component.getHealthStatusColor()).toBe(component.red, 'should be red color');

    component.healthStatus = ClusterHealth.WAITING;
    expect(component.getHealthStatusColor()).toBe(component.orange, 'should be orange color');

  });

});
