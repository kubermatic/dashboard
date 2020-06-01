import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../../../core/services';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeGCPCluster} from '../../../../../testing/fake-data/cluster.fake';
import {GCPProviderOptionsComponent} from './gcp-provider-options.component';

describe('GCPProviderOptionsComponent', () => {
  let fixture: ComponentFixture<GCPProviderOptionsComponent>;
  let component: GCPProviderOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, ReactiveFormsModule, SharedModule],
      declarations: [GCPProviderOptionsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GCPProviderOptionsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeGCPCluster();
    component.cluster.spec.cloud.gcp = {
      serviceAccount: '',
      network: '',
      subnetwork: '',
    };
    fixture.detectChanges();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});
