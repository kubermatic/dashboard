import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ReactiveFormsModule} from '@angular/forms';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeAzureCluster} from '../../../../testing/fake-data/cluster.fake';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {AzureClusterSettingsComponent} from './azure.component';

describe('AzureClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AzureClusterSettingsComponent>;
  let component: AzureClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        AzureClusterSettingsComponent
      ],
      providers: [
        WizardService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureClusterSettingsComponent);
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
      vnet: ''
    };
    fixture.detectChanges();
  });

  it('should create the azure cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    fixture.detectChanges();
    expect(component.azureSettingsForm.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.azureSettingsForm.reset();
    fixture.detectChanges();

    expect(component.azureSettingsForm.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.azureSettingsForm.controls.clientID.hasError('required')).toBeTruthy('client ID field has required error');
    expect(component.azureSettingsForm.controls.clientSecret.hasError('required')).toBeTruthy('client secret field has required error');
    expect(component.azureSettingsForm.controls.tenantID.hasError('required')).toBeTruthy('tenant ID field has required error');
    expect(component.azureSettingsForm.controls.subscriptionID.hasError('required')).toBeTruthy('subscription ID field has required error');

    component.azureSettingsForm.controls.clientID.patchValue('foo');
    fixture.detectChanges();
    expect(component.azureSettingsForm.controls.clientID.hasError('required')).toBeFalsy('client ID has no required error after setting value');
    expect(component.azureSettingsForm.valid).toBeFalsy('form is still invalid after setting only client ID');

    component.azureSettingsForm.controls.clientSecret.patchValue('bar');
    fixture.detectChanges();
    expect(component.azureSettingsForm.controls.clientSecret.hasError('required')).toBeFalsy('client secret field has no required error after setting value');
    expect(component.azureSettingsForm.valid).toBeFalsy('form is still invalid after setting both client ID and client secret');

    component.azureSettingsForm.controls.tenantID.patchValue('tenant');
    fixture.detectChanges();
    expect(component.azureSettingsForm.controls.tenantID.hasError('required')).toBeFalsy('tenant ID field has no required error after setting value');
    expect(component.azureSettingsForm.valid).toBeFalsy('form is still invalid after setting client ID, client secret and tenant ID');

    component.azureSettingsForm.controls.subscriptionID.patchValue('subscription');
    fixture.detectChanges();
    expect(component.azureSettingsForm.controls.subscriptionID.hasError('required')).toBeFalsy('subscription ID field has no required error after setting value');
    expect(component.azureSettingsForm.valid).toBeTruthy('form is still invalid after setting client ID, client secret, tenant ID and subscription ID');
  });
});
