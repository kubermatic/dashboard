import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeHetznerCluster} from '../../../../testing/fake-data/cluster.fake';
import {HetznerClusterSettingsComponent} from './hetzner.component';

describe('HetznerClusterSettingsComponent', () => {
  let fixture: ComponentFixture<HetznerClusterSettingsComponent>;
  let component: HetznerClusterSettingsComponent;

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
            HetznerClusterSettingsComponent,
          ],
          providers: [
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HetznerClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeHetznerCluster();
    component.cluster.spec.cloud.hetzner.token = '';
    fixture.detectChanges();
  });

  it('should create the hetzner cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('token field validity', () => {
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.token.valid).toBeFalsy();
    expect(component.form.controls.token.hasError('required')).toBeTruthy();

    component.form.controls.token.patchValue('foo');
    expect(component.form.controls.token.hasError('required')).toBeFalsy();
    expect(component.form.controls.token.hasError('minlength')).toBeTruthy();

    component.form.controls.token.patchValue('1234567890123456789012345678901234567890123456789012345678901234567890');
    expect(component.form.controls.token.hasError('required')).toBeFalsy();
    expect(component.form.controls.token.hasError('minlength')).toBeFalsy();
    expect(component.form.controls.token.hasError('maxlength')).toBeTruthy();

    component.form.controls.token.patchValue('vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    expect(component.form.controls.token.hasError('required')).toBeFalsy();
    expect(component.form.controls.token.hasError('minlength')).toBeFalsy();
    expect(component.form.controls.token.hasError('maxlength')).toBeFalsy();
  });
});
