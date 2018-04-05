import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ReactiveFormsModule} from '@angular/forms';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeHetznerCluster} from '../../../../testing/fake-data/cluster.fake';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {HetznerClusterSettingsComponent} from './hetzner.component';

describe('HetznerClusterSettingsComponent', () => {
  let fixture: ComponentFixture<HetznerClusterSettingsComponent>;
  let component: HetznerClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        HetznerClusterSettingsComponent
      ],
      providers: [
        WizardService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HetznerClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeHetznerCluster;
    component.cluster.spec.cloud.hetzner.token = '';
    fixture.detectChanges();
  });

  it('should create the digitalocean cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.hetznerSettingsForm.valid).toBeFalsy();
  });

  it('token field validity', () => {
    expect(component.hetznerSettingsForm.valid).toBeFalsy('form is initially not valid');
    expect(component.hetznerSettingsForm.controls.token.valid).toBeFalsy('token field is initially not valid');
    expect(component.hetznerSettingsForm.controls.token.hasError('required')).toBeTruthy('token field has initially required error');

    component.hetznerSettingsForm.controls.token.patchValue('foo');
    expect(component.hetznerSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting foo');
    expect(component.hetznerSettingsForm.controls.token.hasError('minlength')).toBeTruthy('token field has min length error after setting foo');

    component.hetznerSettingsForm.controls.token.patchValue('1234567890123456789012345678901234567890123456789012345678901234567890');
    expect(component.hetznerSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting 70 chars');
    expect(component.hetznerSettingsForm.controls.token.hasError('minlength')).toBeFalsy('token field has no min length error after setting 70 chars');
    expect(component.hetznerSettingsForm.controls.token.hasError('maxlength')).toBeTruthy('token field has max length error after setting 70 chars');

    component.hetznerSettingsForm.controls.token.patchValue('vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    expect(component.hetznerSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting valid token');
    expect(component.hetznerSettingsForm.controls.token.hasError('minlength')).toBeFalsy('token field has no min length error after setting valid token');
    expect(component.hetznerSettingsForm.controls.token.hasError('maxlength')).toBeFalsy('token field has no max length error after setting valid token');
  });
});
