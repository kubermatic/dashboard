import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AWSClusterSettingsComponent } from './aws.component';
import { SharedModule } from '../../../../shared/shared.module';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { fakeAWSCluster } from '../../../../testing/fake-data/cluster.fake';

describe('AWSClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AWSClusterSettingsComponent>;
  let component: AWSClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        AWSClusterSettingsComponent
      ],
      providers: [
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster();
    component.cluster.spec.cloud.aws = {
      accessKeyId: '',
      secretAccessKey: '',
      routeTableId: '',
      subnetId: '',
      securityGroup: '',
      vpcId: '',
    };
    fixture.detectChanges();
  });

  it('should create the aws cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form initially invalid', () => {
    fixture.detectChanges();
    expect(component.awsSettingsForm.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.awsSettingsForm.reset();
    fixture.detectChanges();

    expect(component.awsSettingsForm.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.awsSettingsForm.controls.accessKeyId.hasError('required')).toBeTruthy('access key id field has required error');
    expect(component.awsSettingsForm.controls.secretAccessKey.hasError('required')).toBeTruthy('secret access key field has required error');

    component.awsSettingsForm.controls.accessKeyId.patchValue('foo');
    fixture.detectChanges();
    expect(component.awsSettingsForm.controls.accessKeyId.hasError('required')).toBeFalsy('access key id has no required error after setting value');
    expect(component.awsSettingsForm.valid).toBeFalsy('form is still invalid after setting only access key id');

    component.awsSettingsForm.controls.secretAccessKey.patchValue('bar');
    fixture.detectChanges();
    expect(component.awsSettingsForm.controls.secretAccessKey.hasError('required')).toBeFalsy('secret access key field has no required error after setting value');
    expect(component.awsSettingsForm.valid).toBeTruthy('form is valid after setting both access key id and secret access key');
  });
});
