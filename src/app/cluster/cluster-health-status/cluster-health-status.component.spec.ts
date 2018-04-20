import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from './../../testing/router-stubs';

import { ClusterHealthStatusComponent } from './cluster-health-status.component';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { ClusterService } from '../../core/services';

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
        ClusterService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterHealthStatusComponent);
    component = fixture.componentInstance;

    component.cluster = fakeDigitaloceanCluster;
  });

  it('should create the cluster health status cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should set class to circle', () => {
    component.healthStatus = 'statusRunning';
    fixture.detectChanges();
    
    const de = fixture.debugElement.query(By.css('.green'));
    expect(de).not.toBeNull('should have class green');
  });

  it('should get HealthStatusColor', () => {
    fixture.detectChanges();

    component.healthStatus = 'statusRunning';
    expect(component.getHealthStatusColor()).toBe(component.green, 'should be green color');

    component.healthStatus = 'statusFailed';
    expect(component.getHealthStatusColor()).toBe(component.red, 'should be red color');

    component.healthStatus = 'statusDeleting';
    expect(component.getHealthStatusColor()).toBe(component.red, 'should be red color');

    component.healthStatus = 'statusWaiting';
    expect(component.getHealthStatusColor()).toBe(component.orange, 'should be orange color');

  });

});
