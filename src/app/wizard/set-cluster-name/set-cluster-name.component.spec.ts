import { SharedModule } from '../../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SetClusterNameComponent } from './set-cluster-name.component';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ClusterNameGeneratorMock } from '../../testing/services/name-generator-mock.service';
import { WizardService } from '../../core/services/wizard/wizard.service';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule
];

describe('SetClusterNameComponent', () => {
  let fixture: ComponentFixture<SetClusterNameComponent>;
  let component: SetClusterNameComponent;
  let nameGenerator: ClusterNameGenerator;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SetClusterNameComponent
      ],
      providers: [
        WizardService,
        { provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetClusterNameComponent);
    component = fixture.componentInstance;
    component.cluster = {
      metadata: {},
      spec: {
        humanReadableName: '',
        masterVersion: '',
        pause: false,
        cloud: {
          dc: '',
        },
      },

    };
    fixture.detectChanges();
    nameGenerator = fixture.debugElement.injector.get(ClusterNameGenerator);
  });

  it('should create the set-cluster-name cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.clusterNameForm.valid).toBeFalsy();
  });

  it('name field validity', () => {
    const name = component.clusterNameForm.controls.name;
    expect(name.hasError('required')).toBeTruthy('name field has required error');

    name.setValue('test-name');
    expect(name.hasError('required')).toBeFalsy('name field has no required error');

    expect(component.clusterNameForm.valid).toBeTruthy('form is valid');
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
