import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeAzureCluster} from '../../../../testing/fake-data/cluster.fake';
import {AzureClusterSettingsComponent} from './azure.component';

describe('AzureClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AzureClusterSettingsComponent>;
  let component: AzureClusterSettingsComponent;

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
            AzureClusterSettingsComponent,
          ],
          providers: [
            WizardService,
          ],
        })
        .compileComponents();
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
      vnet: '',
    };
    fixture.detectChanges();
  });

  it('should create the azure cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    fixture.detectChanges();
    expect(component.form.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.form.reset();
    fixture.detectChanges();

    expect(component.form.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.form.controls.clientID.hasError('required')).toBeTruthy('client ID field has required error');
    expect(component.form.controls.clientSecret.hasError('required'))
        .toBeTruthy('client secret field has required error');
    expect(component.form.controls.tenantID.hasError('required')).toBeTruthy('tenant ID field has required error');
    expect(component.form.controls.subscriptionID.hasError('required'))
        .toBeTruthy('subscription ID field has required error');

    component.form.controls.clientID.patchValue('foo');
    fixture.detectChanges();
    expect(component.form.controls.clientID.hasError('required'))
        .toBeFalsy('client ID has no required error after setting value');
    expect(component.form.valid).toBeFalsy('form is still invalid after setting only client ID');

    component.form.controls.clientSecret.patchValue('bar');
    fixture.detectChanges();
    expect(component.form.controls.clientSecret.hasError('required'))
        .toBeFalsy('client secret field has no required error after setting value');
    expect(component.form.valid).toBeFalsy('form is still invalid after setting both client ID and client secret');

    component.form.controls.tenantID.patchValue('tenant');
    fixture.detectChanges();
    expect(component.form.controls.tenantID.hasError('required'))
        .toBeFalsy('tenant ID field has no required error after setting value');
    expect(component.form.valid)
        .toBeFalsy('form is still invalid after setting client ID, client secret and tenant ID');

    component.form.controls.subscriptionID.patchValue('subscription');
    fixture.detectChanges();
    expect(component.form.controls.subscriptionID.hasError('required'))
        .toBeFalsy('subscription ID field has no required error after setting value');
    expect(component.form.valid)
        .toBeTruthy('form is still invalid after setting client ID, client secret, tenant ID and subscription ID');
  });
});
