import { SetProviderComponent } from './set-provider.component';
import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { fakeNodeDatacenters } from '../../testing/fake-data/datacenter.fake';

describe('SetProviderComponent', () => {
  let fixture: ComponentFixture<SetProviderComponent>;
  let component: SetProviderComponent;

  beforeEach(async(() => {
    const dcMock = jasmine.createSpyObj('DatacenterService', ['getDataCenters']);
    dcMock.getDataCenters.and.returnValue(asyncData(fakeNodeDatacenters()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule,
        MatButtonToggleModule
      ],
      declarations: [
        SetProviderComponent
      ],
      providers: [
        { provide: DatacenterService, useValue: dcMock },
        WizardService,
      ],
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
  }));

  it('should get provider from cluster', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
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
      }
    };
    fixture.detectChanges();
    expect(component.setProviderForm.controls.provider.valid).toBeFalsy();
  }));
});
