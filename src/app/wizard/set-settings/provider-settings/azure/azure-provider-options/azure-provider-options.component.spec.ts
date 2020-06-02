import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../../../core/services/wizard/wizard.service';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeAzureCluster} from '../../../../../testing/fake-data/cluster.fake';
import {AzureProviderOptionsComponent} from './azure-provider-options.component';

describe('AzureProviderOptionsComponent', () => {
  let fixture: ComponentFixture<AzureProviderOptionsComponent>;
  let component: AzureProviderOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [AzureProviderOptionsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureProviderOptionsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAzureCluster();
    component.cluster.spec.cloud.azure = {
      clientID: '',
      clientSecret: '',
      resourceGroup: '',
      routeTable: '',
      securityGroup: '',
      subnet: '',
      subscriptionID: '',
      tenantID: '',
      vnet: '',
    };
    fixture.detectChanges();
  });

  it('should create the azure cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
