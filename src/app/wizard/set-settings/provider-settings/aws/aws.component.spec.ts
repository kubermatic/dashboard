import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {WizardService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeAWSCluster} from '../../../../testing/fake-data/cluster.fake';

import {AWSClusterSettingsComponent} from './aws.component';

describe('AWSClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AWSClusterSettingsComponent>;
  let component: AWSClusterSettingsComponent;

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
            AWSClusterSettingsComponent,
          ],
          providers: [
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster();
    component.cluster.spec.cloud.aws = {
      accessKeyId: '',
      secretAccessKey: '',
      routeTableId: '',
      securityGroupId: '',
      vpcId: '',
      instanceProfileName: '',
      roleARN: '',
    };
    fixture.detectChanges();
  });

  it('should create the aws cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form initially invalid', () => {
    fixture.detectChanges();
    expect(component.form.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.form.reset();
    fixture.detectChanges();

    expect(component.form.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.form.controls.accessKeyId.hasError('required'))
        .toBeTruthy('access key id field has required error');
    expect(component.form.controls.secretAccessKey.hasError('required'))
        .toBeTruthy('secret access key field has required error');

    component.form.controls.accessKeyId.patchValue('foo');
    fixture.detectChanges();
    expect(component.form.controls.accessKeyId.hasError('required'))
        .toBeFalsy('access key id has no required error after setting value');
    expect(component.form.valid).toBeFalsy('form is still invalid after setting only access key id');

    component.form.controls.secretAccessKey.patchValue('bar');
    fixture.detectChanges();
    expect(component.form.controls.secretAccessKey.hasError('required'))
        .toBeFalsy('secret access key field has no required error after setting value');
    expect(component.form.valid).toBeTruthy('form is valid after setting both access key id and secret access key');
  });
});
