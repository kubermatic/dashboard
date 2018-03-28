import { datacentersFake } from './../../testing/fake-data/datacenter.fake';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { WizardActions } from '../../redux/actions/wizard.actions';
import { InputValidationService } from '../../core/services';
import { ReactiveFormsModule } from '@angular/forms';
import { SetDatacenterComponent } from './set-datacenter.component';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';
import { Observable } from 'rxjs/Observable';

const modules: any[] = [
  BrowserModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule
];

function setMockNgRedux(datacenter: DataCenterEntity, provider: string): void {
  const stepStub = MockNgRedux.getSelectorStub(['wizard', 'setDatacenterForm', 'datacenter']);
  stepStub.next(datacenter);

  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.next(provider);
}

function completeRedux() {
  const stepStub = MockNgRedux.getSelectorStub(['wizard', 'setDatacenterForm', 'datacenter']);
  stepStub.complete();

  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.complete();
}

describe('SetDatacenterComponent', () => {
  let fixture: ComponentFixture<SetDatacenterComponent>;
  let component: SetDatacenterComponent;
  let dcService: DatacenterService;

  beforeEach(async(() => {
    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SetDatacenterComponent
      ],
      providers: [
        InputValidationService,
        { provide: DatacenterService, useClass: DatacenterMockService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetDatacenterComponent);
    component = fixture.componentInstance;

    dcService = fixture.debugElement.injector.get(DatacenterService);
  });

  it('should create the set-datacenter cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    setMockNgRedux(null, 'digitalocean');
    completeRedux();
    fixture.detectChanges();

    expect(component.setDatacenterForm.valid).toBeFalsy();
  });

  it('should get datacenter and provider from redux', () => {
    setMockNgRedux(datacentersFake[0], 'digitalocean');
    completeRedux();
    fixture.detectChanges();

    component.datacenter$.subscribe(
      selectedDatacenter => expect(selectedDatacenter).toEqual(datacentersFake[0], 'should get datacenter'),
    );
    component.provider$.subscribe(
      selectedProvider => expect(selectedProvider).toBe('digitalocean', 'should get provider'),
    );
  });

  it('should get datacenter list', fakeAsync(() => {
    const datacenters = datacentersFake;
    const provider = 'digitalocean';
    setMockNgRedux(datacenters[0], provider);
    completeRedux();
    fixture.detectChanges();
    tick();

    expect(component.datacenters[provider]).toEqual([datacenters[0], datacenters[1]]);
  }));

  it('should call nextStep if datacenter is alone', fakeAsync(() => {
    const datacenters = datacentersFake;
    component.selectedProvider = 'digitalocean';
    const spyNextStep = spyOn(WizardActions, 'nextStep');
    const spyGetDC = spyOn(dcService, 'getDataCenters').and.returnValue(Observable.of([datacenters[1]]));
    setMockNgRedux(datacenters[1], component.selectedProvider);
    completeRedux();
    fixture.detectChanges();
    tick();

    expect(spyNextStep.and.callThrough()).toHaveBeenCalledTimes(1);
  }));

  it('should call nextStep after setDatacenterForm changes', () => {
    const datacenters = datacentersFake;
    const provider = 'digitalocean';
    const spyNextStep = spyOn(WizardActions, 'nextStep');
    setMockNgRedux(datacenters[0], provider);
    completeRedux();
    fixture.detectChanges();

    component.setDatacenterForm.patchValue({ datacenter: component.datacenters[1] });

    expect(spyNextStep.and.callThrough()).toHaveBeenCalledTimes(1);
  });
});
