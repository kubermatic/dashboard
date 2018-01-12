import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '../../../testing/router-stubs';

import { By } from '@angular/platform-browser';
import {TestBed, async, ComponentFixture, inject, fakeAsync, tick} from '@angular/core/testing';
import { RouterLinkStubDirective, RouterOutletStubComponent, RouterLinkActiveStubDirective } from './../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';

import { SidenavComponent } from './sidenav.component';
import { DebugElement } from '@angular/core/src/debug/debug_node';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    RouterTestingModule,
    SharedModule
];

describe('SidenavComponent', () => {
    let fixture: ComponentFixture<SidenavComponent>;
    let component: SidenavComponent;
    let linkDes: DebugElement[];
    let links: RouterLinkStubDirective[];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SidenavComponent
            ],
            providers: [
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidenavComponent);
        component = fixture.componentInstance;
        linkDes = fixture.debugElement
            .queryAll(By.directive(RouterLinkStubDirective));

        links = linkDes
            .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
    });

    it('should create the sidenav cmp', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should get RouterLinks from template', () => {
        fixture.detectChanges();

        expect(links.length).toBe(3, 'should have 3 links');
        expect(links[0].linkParams).toBe('/wizard', '1st link should go to Wizard');
        expect(links[1].linkParams).toBe('/clusters', '2nd link should go to Cluster list');
    });

    it('can click Wizard link in template', () => {
        fixture.detectChanges();

        const wizardLinkDe = linkDes[0];
        const wizardLink = links[0];

        expect(wizardLink.navigatedTo).toBeNull('link should not have navigated yet');

        click(wizardLinkDe);
        fixture.detectChanges();

        expect(wizardLink.navigatedTo).toBe('/wizard');
    });

});
