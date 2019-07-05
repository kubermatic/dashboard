import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService} from '../../core/services/datacenter/datacenter.service';
import {WizardService} from '../../core/services/wizard/wizard.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {SetDatacenterComponent} from './set-datacenter.component';

describe('SetDatacenterComponent', () => {
  let fixture: ComponentFixture<SetDatacenterComponent>;
  let component: SetDatacenterComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            MatButtonToggleModule,
            HttpClientModule,
          ],
          declarations: [
            SetDatacenterComponent,
          ],
          providers: [
            WizardService,
            {provide: DatacenterService, useClass: DatacenterMockService},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetDatacenterComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.cluster.spec.cloud.dc = '';

    fixture.detectChanges();

    fixture.debugElement.injector.get(DatacenterService);
  });

  it('should create the set-datacenter cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.setDatacenterForm.valid).toBeFalsy();
  });
});
