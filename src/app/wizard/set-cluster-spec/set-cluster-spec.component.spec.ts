import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {MachineNetworksModule} from '../../machine-networks/machine-networks.module';
import {SharedModule} from '../../shared/shared.module';
import {masterVersionsFake} from '../../testing/fake-data/cluster-spec.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {ClusterNameGeneratorMock} from '../../testing/services/name-generator-mock.service';
import {SetClusterSpecComponent} from './set-cluster-spec.component';
const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule,
];

describe('SetClusterSpecComponent', () => {
  let fixture: ComponentFixture<SetClusterSpecComponent>;
  let component: SetClusterSpecComponent;
  let nameGenerator: ClusterNameGenerator;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getMasterVersions']);
    apiMock.getMasterVersions.and.returnValue(asyncData(masterVersionsFake()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            SetClusterSpecComponent,
          ],
          providers: [
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock},
          ],
        })
        .compileComponents();
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
          gateway: '',
        }],
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
