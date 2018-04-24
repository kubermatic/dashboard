import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterLinkStubDirective, RouterTestingModule } from './../../testing/router-stubs';
import { click } from './../../testing/utils/click-handler';
import { ClusterListComponent } from './cluster-list.component';
import { ClusterItemComponent } from './cluster-item/cluster-item.component';
import { Auth } from './../../core/services/auth/auth.service';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { ApiService } from '../../core/services/api/api.service';
import { fakeAWSCluster } from '../../testing/fake-data/cluster.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { fakeSeedDatacenters } from '../../testing/fake-data/datacenter.fake';
import Spy = jasmine.Spy;
import { ClusterHealthStatusComponent } from '../cluster-health-status/cluster-health-status.component';
import { ClusterService } from '../../core/services';


describe('ClusterListComponent', () => {
  let fixture: ComponentFixture<ClusterListComponent>;
  let component: ClusterListComponent;
  let getClustersSpy: Spy;
  let getSeedDatacentersSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getClusters']);
    getClustersSpy = apiMock.getClusters.and.returnValue(asyncData([fakeAWSCluster]));
    const dcMock = jasmine.createSpyObj('DatacenterService', ['getSeedDataCenters']);
    getSeedDatacentersSpy = dcMock.getSeedDataCenters.and.returnValue(asyncData(fakeSeedDatacenters));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule,
      ],
      declarations: [
        ClusterListComponent,
        ClusterItemComponent,
        ClusterHealthStatusComponent
      ],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useValue: dcMock },
        { provide: Auth, useClass: AuthMockService },
        ClusterService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster list cmp', fakeAsync(() => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    discardPeriodicTasks();
  }));

  it('should get cluster list', fakeAsync(() => {
    fixture.detectChanges();
    tick(1);
    expect(getSeedDatacentersSpy.and.callThrough()).toHaveBeenCalled();
    expect(getClustersSpy.and.callThrough()).toHaveBeenCalled();
    expect(component.clusters).toEqual([fakeAWSCluster]);
    discardPeriodicTasks();
  }));

  it('should render cluster list', fakeAsync(() => {
    component.loading = false;
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.km-card-list'));

    expect(de).not.toBeNull('list should be rendered');
    discardPeriodicTasks();
  }));

  it('should not render cluster list', fakeAsync(() => {
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.km-card-list'));

    expect(de).toBeNull('list should not be rendered');
    discardPeriodicTasks();
  }));

  it('should get RouterLinks from template', fakeAsync(() => {
    component.loading = false;
    fixture.detectChanges();

    const linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    const links = linkDes
      .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
    expect(links.length).toBe(2, 'should have 2 links');
    discardPeriodicTasks();
  }));

  it('can click Wizard link in template', fakeAsync(() => {
    component.loading = false;
    fixture.detectChanges();

    const linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    const links = linkDes
      .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);

    expect(links[0].navigatedTo).toBeNull('link should not have navigated yet');

    click(linkDes[0]);
    fixture.detectChanges();

    expect(links[0].navigatedTo).toBe('/wizard');
    discardPeriodicTasks();
  }));
});
