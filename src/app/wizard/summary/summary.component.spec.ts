import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { ApiService } from '../../core/services';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule
];

describe('SummaryComponent', () => {
  let fixture: ComponentFixture<SummaryComponent>;
  let component: SummaryComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SummaryComponent
      ],
      providers: [
        { provide: ApiService, useClass: ApiMockService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create the set-settings cmp', () => {
    expect(component).toBeTruthy();
  });
  //
  // it('should get data from redux', fakeAsync(() => {
  //   setMockNgRedux('digitalocean', fakeNodeDatacenters[0], fakeDigitaloceanCreateNode, clusterModelFake, 3);
  //   completeRedux();
  //   fixture.detectChanges();
  //   tick();
  //
  //   expect(component.provider).toBe('digitalocean', 'should get provider');
  //   expect(component.region).toEqual(fakeNodeDatacenters[0], 'should get datacenter');
  //   expect(component.nodeModel).toEqual(fakeDigitaloceanCreateNode, 'should get node model');
  //   expect(component.clusterModel).toEqual(clusterModelFake, 'should get cluster model');
  //   expect(component.nodeCount).toBe(3, 'should get node count');
  // }));
  //
  // it('should call get sshkeys method', fakeAsync(() => {
  //   const apiService = fixture.debugElement.injector.get(ApiService);
  //   const spyGetSSHKeys = spyOn(apiService, 'getSSHKeys').and.returnValue(Observable.of(fakeSSHKeys));
  //
  //   setMockNgRedux('digitalocean', fakeNodeDatacenters[0], fakeDigitaloceanCreateNode, clusterModelFake, 3);
  //   completeRedux();
  //
  //   fixture.detectChanges();
  //   tick();
  //
  //   expect(spyGetSSHKeys.and.callThrough()).toHaveBeenCalledTimes(1);
  // }));
});

