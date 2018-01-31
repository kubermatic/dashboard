import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { SetClusterNameComponent } from './set-cluster-name.component';

import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { InputValidationService } from '../../core/services';
import { ReactiveFormsModule } from '@angular/forms';
import { ClusterNameGeneratorMock } from '../../testing/services/name-generator-mock.service';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SharedModule
];

function setMockNgRedux(name: string): void {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'clusterNameForm', 'name']);
    stepStub.next(name);
}

function completeRedux() {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'clusterNameForm', 'name']);
    stepStub.complete();
}

describe('SetClusterNameComponent', () => {
    let fixture: ComponentFixture<SetClusterNameComponent>;
    let component: SetClusterNameComponent;
    let nameGenerator: ClusterNameGenerator;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SetClusterNameComponent
            ],
            providers: [
                { provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock },
                InputValidationService
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SetClusterNameComponent);
        component = fixture.componentInstance;

        nameGenerator = fixture.debugElement.injector.get(ClusterNameGenerator);
    });

    it('should create the set-cluster-name cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get name from redux', () => {
        setMockNgRedux('test-name');
        completeRedux();
        fixture.detectChanges();

        expect(component.clusterName).toBe('test-name', 'should get a cluster name');
    });

    it('form invalid after creating', () => {
        fixture.detectChanges();

        expect(component.clusterNameForm.valid).toBeFalsy();
    });

    it('name field validity', () => {
        fixture.detectChanges();

        let errors = {};
        const name = component.clusterNameForm.controls['name'];
        errors = name.errors || {};
        expect(errors['required']).toBeTruthy();

        name.setValue('test-name');
        errors = name.errors || {};
        expect(errors['required']).toBeFalsy();
        expect(component.clusterNameForm.valid).toBeTruthy();
    });

    it('should call generateName method', () => {
        const generatedName = 'generated-name';
        const spyGenerateName = spyOn(nameGenerator, 'generateName').and.returnValue(generatedName);
        fixture.detectChanges();

        component.generateName();
        fixture.detectChanges();

        const nameElement = fixture.debugElement.query(By.css('#name')).nativeElement;

        expect(spyGenerateName.and.callThrough()).toHaveBeenCalledTimes(1);
        expect(component.clusterNameForm.controls['name'].value).toBe(generatedName, 'should patch value');
        expect(nameElement.value).toBe(generatedName, 'should display value in template');
    });
});
