import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService, WizardService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {fakeNodeDatacenters} from '../../testing/fake-data/datacenter.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {SetProviderComponent} from './set-provider.component';
import {ClusterType} from '../../shared/entity/ClusterEntity';

describe('SetProviderComponent', () => {
  let fixture: ComponentFixture<SetProviderComponent>;
  let component: SetProviderComponent;

  beforeEach(async(() => {
    const dcMock = {getDataCenters: jest.fn()};
    dcMock.getDataCenters.mockReturnValue(asyncData(fakeNodeDatacenters()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule,
        MatButtonToggleModule,
        HttpClientModule,
      ],
      declarations: [SetProviderComponent],
      providers: [{provide: DatacenterService, useValue: dcMock}, WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetProviderComponent);
    component = fixture.componentInstance;
  });

  it('should create the set-provider cmp', fakeAsync(() => {
    expect(component).toBeTruthy();
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    tick();
  }));

  it('should get provider from cluster', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    tick();
    expect(component.setProviderForm.controls.provider.valid).toBeTruthy();
    expect(component.setProviderForm.controls.provider.value === 'digitalocean').toBeTruthy();
  }));

  it('should be initially invalid', fakeAsync(() => {
    component.cluster = {
      name: '',
      spec: {
        cloud: {
          dc: '',
        },
        version: '',
      },
      type: ClusterType.Empty,
    };
    fixture.detectChanges();
    tick();
    expect(component.setProviderForm.controls.provider.valid).toBeFalsy();
  }));
});
