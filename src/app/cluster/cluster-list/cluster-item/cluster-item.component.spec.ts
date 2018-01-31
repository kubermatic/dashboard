import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture, inject, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from './../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { DataCenterEntity } from './../../../shared/entity/DatacenterEntity';
import { ClusterItemComponent } from './cluster-item.component';
import { Auth } from './../../../core/services/auth/auth.service';
import { AuthMockService } from '../../../testing/services/auth-mock.service';
import { DatacenterService } from '../../../core/services/index';
import { DatacenterMockService } from './../../../testing/services/datacenter-mock.service';
import { clusterFake } from '../../../testing/fake-data/cluster.fake';
import { datacentersFake } from '../../../testing/fake-data/datacenter.fake';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    RouterTestingModule,
    SharedModule
];

describe('ClusterItemComponent', () => {
    let fixture: ComponentFixture<ClusterItemComponent>;
    let component: ClusterItemComponent;
    let dcService: DatacenterService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ClusterItemComponent
            ],
            providers: [
                { provide: DatacenterService, useClass: DatacenterMockService },
                { provide: Auth, useClass: AuthMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClusterItemComponent);
        component = fixture.componentInstance;
        dcService = fixture.debugElement.injector.get(DatacenterService);
    });

    it('should create the cluster item cmp', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should set statusRunning class', fakeAsync(() => {
        component.sortedData = clusterFake;

        fixture.detectChanges();
        tick();

        const de = fixture.debugElement.query(By.css('.statusRunning'));
        expect(de).toBeTruthy();
    }));

    it('should set path of cluster image', fakeAsync(() => {
        component.sortedData = clusterFake;

        fixture.detectChanges();
        tick();

        const de = fixture.debugElement.query(By.css('.cluster-image'));
        expect(de.properties.src).toBe('/assets/images/clouds/digitalocean.png');
    }));
});
