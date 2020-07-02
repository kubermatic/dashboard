import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {WizardService} from '../../../../../core/services';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeAWSCluster} from '../../../../../testing/fake-data/cluster.fake';

import {AWSProviderOptionsComponent} from './aws-provider-options.component';

describe('AWSProviderOptionsComponent', () => {
  let fixture: ComponentFixture<AWSProviderOptionsComponent>;
  let component: AWSProviderOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [AWSProviderOptionsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSProviderOptionsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster();
    component.cluster.spec.cloud.aws = {
      accessKeyId: '',
      secretAccessKey: '',
      routeTableId: '',
      securityGroupID: '',
      vpcId: '',
      instanceProfileName: '',
      roleARN: '',
    };
    fixture.detectChanges();
  });

  it('should create the aws cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
