import { SharedModule } from '../../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgRedux } from '@angular-redux/store';
import { ReactiveFormsModule } from '@angular/forms';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { OpenstackClusterComponent } from './openstack.component';
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

describe('OpenstackClusterComponent', () => {
    let fixture: ComponentFixture<OpenstackClusterComponent>;
    let component: OpenstackClusterComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                OpenstackClusterComponent
            ],
            providers: [
                InputValidationService
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OpenstackClusterComponent);
        component = fixture.componentInstance;
    });

    it('should create the aws cluster cmp', () => {
        expect(component).toBeTruthy();
    });

    it('form invalid after creating', () => {
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
            wizard: {
                openstackClusterForm: {
                    os_domain: 'Default',
                    os_tenant: '',
                    os_username: '',
                    os_password: '',
                    os_network: '',
                    os_security_groups: '',
                    os_floating_ip_pool: '',
                    os_cas: false
                }
            }
        });

        fixture.detectChanges();

        expect(component.osClusterForm.valid).toBeFalsy();
    });

    it('should set cloud spec after form changing', () => {
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
            wizard: {
                openstackClusterForm: {
                    os_domain: 'Default',
                    os_tenant: '',
                    os_username: '',
                    os_password: '',
                    os_network: '',
                    os_security_groups: '',
                    os_floating_ip_pool: '',
                    os_cas: false
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
