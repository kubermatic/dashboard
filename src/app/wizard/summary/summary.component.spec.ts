import { Observable } from 'rxjs/Observable';
import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { ApiService } from 'app/core/services/api/api.service';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { datacentersFake } from './../../testing/fake-data/datacenter.fake';
import { SSHKeysFake } from './../../testing/fake-data/sshkey.fake';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { SummaryComponent } from './summary.component';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { nodeModelFake } from '../../testing/fake-data/node.fake';
import { clusterModelFake } from '../../testing/fake-data/cluster.fake';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    SharedModule
];

function setMockNgRedux(provider: string, datacenter: DataCenterEntity, nodeModel: CreateNodeModel, clusterModel: CreateClusterModel): void {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.next(provider);

    const datacenterStub = MockNgRedux.getSelectorStub(['wizard', 'setDatacenterForm', 'datacenter']);
    datacenterStub.next(datacenter);

    const nodeModelStub = MockNgRedux.getSelectorStub(['wizard', 'nodeModel']);
    nodeModelStub.next(nodeModel);

    const clusterModelStub = MockNgRedux.getSelectorStub(['wizard', 'clusterModel']);
    clusterModelStub.next(clusterModel);
}

function completeRedux() {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.complete();

    const datacenterStub = MockNgRedux.getSelectorStub(['wizard', 'setDatacenterForm', 'datacenter']);
    datacenterStub.complete();

    const nodeModelStub = MockNgRedux.getSelectorStub(['wizard', 'nodeModel']);
    nodeModelStub.complete();

    const clusterModelStub = MockNgRedux.getSelectorStub(['wizard', 'clusterModel']);
    clusterModelStub.complete();
}

describe('SetSettingsComponent', () => {
    let fixture: ComponentFixture<SummaryComponent>;
    let component: SummaryComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SummaryComponent
            ],
            providers: [
                { provide: ApiService, useClass: ApiMockService }
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
    });

    it('should create the set-settings cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get data from redux', fakeAsync(() => {
        setMockNgRedux('digitalocean', datacentersFake[0], nodeModelFake, clusterModelFake);
        completeRedux();
        fixture.detectChanges();
        tick();

        expect(component.provider).toBe('digitalocean', 'should get provider');
        expect(component.region).toEqual(datacentersFake[0], 'should get datacenter');
        expect(component.nodeModel).toEqual(nodeModelFake, 'should get node model');
        expect(component.clusterModel).toEqual(clusterModelFake, 'should get cluster model');
    }));

    it('should call get sshkeys method', fakeAsync(() => {
        const apiService = fixture.debugElement.injector.get(ApiService);
        const spyGetSSHKeys = spyOn(apiService, 'getSSHKeys').and.returnValue(Observable.of(SSHKeysFake));

        setMockNgRedux('digitalocean', datacentersFake[0], nodeModelFake, clusterModelFake);
        completeRedux();

        fixture.detectChanges();
        tick();

        expect(spyGetSSHKeys.and.callThrough()).toHaveBeenCalledTimes(1);
    }));
});

