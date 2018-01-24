import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { AddNodeFormComponent } from './add-node-form/add-node-form.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { InputValidationService } from '../core/services/index';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    NgReduxTestingModule
];

describe('AddNodeComponent', () => {
    let fixture: ComponentFixture<AddNodeComponent>;
    let component: AddNodeComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                AddNodeComponent,
                OpenstackAddNodeComponent,
                AwsAddNodeComponent,
                DigitaloceanAddNodeComponent,
                AddNodeFormComponent
            ],
            providers: [
                InputValidationService
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddNodeComponent);
        component = fixture.componentInstance;
    });

    it('should create the add node cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should render specific form by provider name', () => {
        component.provider = {
            name: 'aws'
        };
        fixture.detectChanges();

        let deAwsForm = fixture.debugElement.query(By.css('.aws-form'));
        expect(deAwsForm).not.toBeNull('should render aws form');

        component.provider = {
            name: 'openstack'
        };
        fixture.detectChanges();

        deAwsForm = fixture.debugElement.query(By.css('.aws-form'));
        const deOpenstackForm = fixture.debugElement.query(By.css('.openstack-form'));

        expect(deAwsForm).toBeNull('should hide aws form');
        expect(deOpenstackForm).not.toBeNull('should render openstack form');
    });
});
