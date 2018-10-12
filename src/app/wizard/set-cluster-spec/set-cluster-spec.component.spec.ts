import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { MachineNetworksModule } from '../../machine-networks/machine-networks.module';
import { SetClusterSpecComponent } from './set-cluster-spec.component';
import { ApiService, WizardService } from '../../core/services';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ClusterNameGeneratorMock } from '../../testing/services/name-generator-mock.service';
import { asyncData } from '../../testing/services/api-mock.service';
import { masterVersionsFake } from '../../testing/fake-data/cluster-spec.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule
];

describe('SetClusterSpecComponent', () => {
  let fixture: ComponentFixture<SetClusterSpecComponent>;
  let component: SetClusterSpecComponent;
  let nameGenerator: ClusterNameGenerator;
  let getMasterVersionsSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getMasterVersions']);
    getMasterVersionsSpy = apiMock.getMasterVersions.and.returnValue(asyncData(masterVersionsFake()));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SetClusterSpecComponent
      ],
      providers: [
        WizardService,
        { provide: ApiService, useValue: apiMock },
        { provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetClusterSpecComponent);
    component = fixture.componentInstance;
    component.cluster = {
      name: '',
      spec: {
        version: '',
        cloud: {
          dc: '',
        },
        machineNetworks: [{
          cidr: '',
          dnsServers: [],
          gateway: ''
        }]
      },

    };
    fixture.detectChanges();
    nameGenerator = fixture.debugElement.injector.get(ClusterNameGenerator);
  });

  it('should create the set-cluster-spec cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.clusterSpecForm.valid).toBeFalsy();
  });

  it('name field validity', () => {
    const name = component.clusterSpecForm.controls.name;
    expect(name.hasError('required')).toBeTruthy('name field has required error');

    name.setValue('test-name');
    expect(name.hasError('required')).toBeFalsy('name field has no required error');

    expect(component.clusterSpecForm.valid).toBeTruthy('form is valid');
  });

  it('should call generateName method', () => {
    const generatedName = 'generated-name';
    const spyGenerateName = spyOn(nameGenerator, 'generateName').and.returnValue(generatedName);
    fixture.detectChanges();

    component.generateName();
    fixture.detectChanges();

    const nameElement = fixture.debugElement.query(By.css('#name')).nativeElement;

    expect(spyGenerateName.and.callThrough()).toHaveBeenCalledTimes(1);
    expect(component.clusterSpecForm.controls['name'].value).toBe(generatedName, 'should patch value');
    expect(nameElement.value).toBe(generatedName, 'should display value in template');
  });
});
