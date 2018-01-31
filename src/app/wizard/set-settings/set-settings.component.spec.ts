import { WizardStubsModule } from './../../testing/components/wizard-stubs';
import { datacentersFake } from './../../testing/fake-data/datacenter.fake';
import { doCloudSpecFake } from './../../testing/fake-data/cloud-spec.fake';
import { CloudSpec } from './../../shared/entity/ClusterEntity';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture } from '@angular/core/testing';

import { WizardActions } from '../../redux/actions/wizard.actions';
import { SetSettingsComponent } from './set-settings.component';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    SharedModule,
    WizardStubsModule
];

function setMockNgRedux(name: string, sshKeys: string[], cloudSpec: CloudSpec): void {
    const nameStub = MockNgRedux.getSelectorStub(['wizard', 'clusterNameForm', 'name']);
    nameStub.next(name);

    const sshStub = MockNgRedux.getSelectorStub(['wizard', 'sshKeyForm', 'ssh_keys']);
    sshStub.next(sshKeys);

    const cloudSpecStub = MockNgRedux.getSelectorStub(['wizard', 'cloudSpec']);
    cloudSpecStub.next(cloudSpec);
}

function completeRedux() {
    const nameStub = MockNgRedux.getSelectorStub(['wizard', 'clusterNameForm', 'name']);
    nameStub.complete();

    const sshStub = MockNgRedux.getSelectorStub(['wizard', 'sshKeyForm', 'ssh_keys']);
    sshStub.complete();

    const cloudSpecStub = MockNgRedux.getSelectorStub(['wizard', 'cloudSpec']);
    cloudSpecStub.complete();
}

describe('SetSettingsComponent', () => {
    let fixture: ComponentFixture<SetSettingsComponent>;
    let component: SetSettingsComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SetSettingsComponent
            ],
            providers: [
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SetSettingsComponent);
        component = fixture.componentInstance;
    });

    it('should create the set-settings cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get data from redux', () => {
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({ wizard: {
            setDatacenterForm: { datacenter: datacentersFake[0] },
            setProviderForm: { provider: 'provider' }
        }});

        setMockNgRedux('cluster-name', ['ssh-test', 'ssh-test'], doCloudSpecFake);
        completeRedux();

        fixture.detectChanges();

        expect(component.clusterName).toBe('cluster-name');
        expect(component.sshKeys).toEqual(['ssh-test', 'ssh-test']);
        expect(component.cloudSpec).toEqual(doCloudSpecFake);
    });

    it('should set cluster model', () => {
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({ wizard: {
            setDatacenterForm: { datacenter: datacentersFake[0] },
            setProviderForm: { provider: 'provider' }
        }});
        const spySetClusterModel = spyOn(WizardActions, 'setClusterModel');

        setMockNgRedux('cluster-name', ['ssh-test', 'ssh-test'], doCloudSpecFake);
        completeRedux();

        fixture.detectChanges();

        expect(spySetClusterModel.and.callThrough()).toHaveBeenCalled();
    });
});
