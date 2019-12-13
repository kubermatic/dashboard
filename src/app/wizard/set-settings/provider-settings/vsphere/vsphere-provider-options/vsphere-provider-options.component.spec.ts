import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, WizardService} from '../../../../../core/services';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeVSphereCluster} from '../../../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../../../testing/services/api-mock.service';
import {VSphereProviderOptionsComponent} from './vsphere-provider-options.component';

describe('VSphereProviderOptionsComponent', () => {
  let fixture: ComponentFixture<VSphereProviderOptionsComponent>;
  let component: VSphereProviderOptionsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            HttpClientModule,
          ],
          declarations: [
            VSphereProviderOptionsComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereProviderOptionsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeVSphereCluster();
    component.cluster.spec.cloud.vsphere.username = '';
    component.cluster.spec.cloud.vsphere.password = '';
    component.cluster.spec.cloud.vsphere.infraManagementUser.username = '';
    component.cluster.spec.cloud.vsphere.infraManagementUser.password = '';
    fixture.detectChanges();
  });

  it('should create the vsphere cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
