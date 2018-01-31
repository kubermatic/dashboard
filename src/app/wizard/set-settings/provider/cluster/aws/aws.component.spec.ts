import { SharedModule } from '../../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgRedux } from '@angular-redux/store';
import { ReactiveFormsModule } from '@angular/forms';

import { TestBed, async, ComponentFixture } from '@angular/core/testing';

import { AWSClusterComponent } from './aws.component';
import { InputValidationService } from './../../../../../core/services/input-validation/input-validation.service';
import { datacentersFake } from '../../../../../testing/fake-data/datacenter.fake';
import { WizardActions } from '../../../../../redux/actions/wizard.actions';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SharedModule
];

describe('AWSClusterComponent', () => {
    let fixture: ComponentFixture<AWSClusterComponent>;
    let component: AWSClusterComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                AWSClusterComponent
            ],
            providers: [
                InputValidationService
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AWSClusterComponent);
        component = fixture.componentInstance;
    });

    it('should create the aws cluster cmp', () => {
        expect(component).toBeTruthy();
    });

    it('form invalid after creating', () => {
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
            wizard: {
                awsClusterForm: {
                    accessKeyId: '',
                    secretAccessKey: '',
                    vpcId: '',
                    subnetId: '',
                    routeTableId: '',
                    aws_cas: false
                }
            }
        });

        fixture.detectChanges();

        expect(component.awsClusterForm.valid).toBeFalsy();
    });

    it('should set cloud spec after form changing', () => {
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
            wizard: {
                awsClusterForm: {
                    accessKeyId: '',
                    secretAccessKey: '',
                    vpcId: '',
                    subnetId: '',
                    routeTableId: '',
                    aws_cas: false
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
});
