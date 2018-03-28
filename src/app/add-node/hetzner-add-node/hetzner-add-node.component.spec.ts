import { ApiService } from '../../core/services/api/api.service';
import { InputValidationService } from '../../core/services';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { AddNodeFormComponent } from './../add-node-form/add-node-form.component';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { MockNgRedux } from '@angular-redux/store/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HetznerAddNodeComponent } from './hetzner-add-node.component';
import { ApiMockService } from '../../testing/services/api-mock.service';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    ReactiveFormsModule,
    NgReduxTestingModule
];

function setMockNgRedux(nodeForm: any): void {
    const nodeFormStub = MockNgRedux.getSelectorStub(['wizard', 'nodeForm']);
    nodeFormStub.next(nodeForm);
}

function completeRedux() {
    const nodeFormStub = MockNgRedux.getSelectorStub(['wizard', 'nodeForm']);
    nodeFormStub.complete();
}

describe('HetznerAddNodeComponent', () => {
    let fixture: ComponentFixture<HetznerAddNodeComponent>;
    let component: HetznerAddNodeComponent;
    let apiSevice: ApiService;

    beforeEach(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
              HetznerAddNodeComponent,
                AddNodeFormComponent
            ],
            providers: [
                InputValidationService,
                { provide: ApiService, useClass: ApiMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HetznerAddNodeComponent);
        component = fixture.componentInstance;

        apiSevice = fixture.debugElement.injector.get(ApiService);
    });

    it('should create the add node cmp', () => {
        expect(component).toBeTruthy();
    });

    it('form valid after creating', () => {
        fixture.detectChanges();

        expect(component.hetznerNodeForm.valid).toBeTruthy();
    });

    it('node count field validity', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        let errors = {};
        const name = component.hetznerNodeForm.controls['node_count'];
        errors = name.errors || {};
        expect(errors['required']).toBeFalsy();
        expect(errors['min']).toBeFalsy();

        name.setValue(0);
        errors = name.errors || {};
        expect(errors['required']).toBeFalsy();
        expect(errors['min']).toBeTruthy();

        name.setValue('');
        errors = name.errors || {};
        expect(errors['required']).toBeTruthy();
    }));
});
