import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { SharedModule } from '../../../../shared/shared.module';
import { fakeDigitaloceanCluster } from '../../../../testing/fake-data/cluster.fake';
import { DigitaloceanClusterSettingsComponent } from './digitalocean.component';

describe('DigitaloceanClusterSettingsComponent', () => {
  let fixture: ComponentFixture<DigitaloceanClusterSettingsComponent>;
  let component: DigitaloceanClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule,
      ],
      declarations: [
        DigitaloceanClusterSettingsComponent,
      ],
      providers: [
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.cluster.spec.cloud.digitalocean.token = '';
    fixture.detectChanges();
  });

  it('should create the digitalocean cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.digitaloceanSettingsForm.valid).toBeFalsy();
  });

  it('token field validity', () => {
    expect(component.digitaloceanSettingsForm.valid).toBeFalsy('form is initially not valid');
    expect(component.digitaloceanSettingsForm.controls.token.valid).toBeFalsy('token field is initially not valid');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('required')).toBeTruthy('token field has initially required error');

    component.digitaloceanSettingsForm.controls.token.patchValue('foo');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting foo');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('minlength')).toBeTruthy('token field has min length error after setting foo');

    component.digitaloceanSettingsForm.controls.token.patchValue('1234567890123456789012345678901234567890123456789012345678901234567890');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting 70 chars');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('minlength')).toBeFalsy('token field has no min length error after setting 70 chars');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('maxlength')).toBeTruthy('token field has max length error after setting 70 chars');

    component.digitaloceanSettingsForm.controls.token.patchValue('vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting valid token');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('minlength')).toBeFalsy('token field has no min length error after setting valid token');
    expect(component.digitaloceanSettingsForm.controls.token.hasError('maxlength')).toBeFalsy('token field has no max length error after setting valid token');
  });
});
