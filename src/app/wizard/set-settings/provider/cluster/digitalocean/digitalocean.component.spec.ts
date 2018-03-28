import { SharedModule } from '../../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgRedux } from '@angular-redux/store';
import { ReactiveFormsModule } from '@angular/forms';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputValidationService } from './../../../../../core/services/input-validation/input-validation.service';
import { datacentersFake } from '../../../../../testing/fake-data/datacenter.fake';
import { WizardActions } from '../../../../../redux/actions/wizard.actions';
import { DigitaloceanClusterComponent } from './digitalocean.component';

const modules: any[] = [
  BrowserModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule
];

describe('DigitaloceanClusterComponent', () => {
  let fixture: ComponentFixture<DigitaloceanClusterComponent>;
  let component: DigitaloceanClusterComponent;

  beforeEach(async(() => {
    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        DigitaloceanClusterComponent
      ],
      providers: [
        InputValidationService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanClusterComponent);
    component = fixture.componentInstance;
  });

  it('should create the digitalocean cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    const ngRedux = fixture.debugElement.injector.get(NgRedux);
    const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
      wizard: {
        digitalOceanClusterForm: {
          access_token: ''
        }
      }
    });

    fixture.detectChanges();

    expect(component.digitalOceanClusterForm.valid).toBeFalsy();
  });

  it('should set cloud spec after form changing', () => {
    const ngRedux = fixture.debugElement.injector.get(NgRedux);
    const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
      wizard: {
        digitalOceanClusterForm: {
          access_token: ''
        },
        setDatacenterForm: {
          datacenter: datacentersFake[0]
        }
      }
    });
    const spySetCloudSpec = spyOn(WizardActions, 'setCloudSpec');

    fixture.detectChanges();

    component.onChange();

    expect(spySetCloudSpec.and.callThrough()).toHaveBeenCalled();
  });

  it('token field validity', () => {
    const ngRedux = fixture.debugElement.injector.get(NgRedux);
    const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
      wizard: {
        digitalOceanClusterForm: {
          access_token: ''
        },
        setDatacenterForm: {
          datacenter: datacentersFake[0]
        }
      }
    });

    fixture.detectChanges();

    let errors = {};
    const token = component.digitalOceanClusterForm.controls['access_token'];
    expect(token.valid).toBeFalsy();

    // Email field is required
    errors = token.errors || {};
    expect(errors['required']).toBeTruthy();

    // Set token to something
    token.setValue('sometoken');
    errors = token.errors || {};
    expect(errors['required']).toBeFalsy();
    expect(errors['pattern']).toBeFalsy();
    expect(errors['minlength']).toBeTruthy();

    // Set token to something with incorrect symbols
    token.setValue('some@vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    errors = token.errors || {};
    expect(errors['required']).toBeFalsy();
    expect(errors['pattern']).toBeTruthy();
    expect(errors['maxlength']).toBeTruthy();

    // Set token to something correct
    token.setValue('vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    errors = token.errors || {};
    expect(errors['required']).toBeFalsy();
    expect(errors['pattern']).toBeFalsy();
  });
});
