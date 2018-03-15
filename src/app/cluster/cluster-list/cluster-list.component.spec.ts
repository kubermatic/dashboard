import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, inject, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule, RouterLinkStubDirective } from './../../testing/router-stubs';
import { click } from './../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { ClusterListComponent } from './cluster-list.component';
import { ClusterItemComponent } from './cluster-item/cluster-item.component';
import { Auth } from './../../core/services/auth/auth.service';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { clustersFake } from '../../testing/fake-data/cluster.fake';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    RouterTestingModule,
    SharedModule
];

describe('ClusterListComponent', () => {
    let fixture: ComponentFixture<ClusterListComponent>;
    let component: ClusterListComponent;
    let apiService: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ClusterListComponent,
                ClusterItemComponent
            ],
            providers: [
                { provide: ApiService, useClass: ApiMockService },
                { provide: Auth, useClass: AuthMockService },
                { provide: DatacenterService, useClass: DatacenterMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClusterListComponent);
        component = fixture.componentInstance;
        apiService = fixture.debugElement.injector.get(ApiService);
    });

    it('should create the cluster list cmp', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should get cluster list', fakeAsync(() => {
        const clusters = clustersFake;
        const spyGetClusters = spyOn(apiService, 'getClusters').and.returnValue(Observable.of(clusters));
        fixture.detectChanges();
        tick();
        component.sub.unsubscribe();

        expect(spyGetClusters.and.callThrough()).toHaveBeenCalled();
        expect(component.clusters["europe-west3-c"]).toEqual(clusters);
    }));

    it('should render cluster list', () => {
        component.loading = false;
        fixture.detectChanges();

        const de = fixture.debugElement.query(By.css('.km-card-list'));

        expect(de).not.toBeNull('list should be rendered');
    });

    it('should not render cluster list', () => {
        fixture.detectChanges();

        const de = fixture.debugElement.query(By.css('.km-card-list'));

        expect(de).toBeNull('list should not be rendered');
    });

    it('should get RouterLinks from template', () => {
        component.loading = false;
        fixture.detectChanges();

        const linkDes = fixture.debugElement
            .queryAll(By.directive(RouterLinkStubDirective));

        const links = linkDes
            .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);

        expect(links.length).toBe(4, 'should have 4 links');
    });

    it('can click Wizard link in template', () => {
        component.loading = false;
        fixture.detectChanges();

        const linkDes = fixture.debugElement
            .queryAll(By.directive(RouterLinkStubDirective));

        const links = linkDes
            .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);

        expect(links[0].navigatedTo).toBeNull('link should not have navigated yet');

        click(linkDes[0]);
        fixture.detectChanges();

        expect(links[0].navigatedTo).toBe('/wizard');
    });
});
