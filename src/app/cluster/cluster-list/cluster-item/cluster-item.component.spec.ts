import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from './../../../testing/router-stubs';
import { ClusterItemComponent } from './cluster-item.component';
import { Auth } from './../../../core/services/auth/auth.service';
import { AuthMockService } from '../../../testing/services/auth-mock.service';
import { DatacenterService } from '../../../core/services/index';
import { DatacenterMockService } from './../../../testing/services/datacenter-mock.service';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { ClusterHealthStatusComponent } from '../../cluster-health-status/cluster-health-status.component';
import { ClusterService} from '../../../core/services';
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
        ClusterService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterItemComponent);
    component = fixture.componentInstance;
    dcService = fixture.debugElement.injector.get(DatacenterService);
  });

  it('should create the cluster item cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should set statusWaiting class odd', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster;
    component.index = 1;
    fixture.detectChanges();
    tick();

    expect(component.getClusterItemClass()).toBe(ClusterHealth.RUNNING + ' odd');
  }));

  it('should set path of cluster image', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster;

    fixture.detectChanges();
    tick();

    const de = fixture.debugElement.query(By.css('.km-provider-logo'));
    expect(de.properties.src).toBe('/assets/images/clouds/digitalocean.png');
  }));
});
