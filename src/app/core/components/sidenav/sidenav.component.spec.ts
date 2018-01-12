import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { By } from '@angular/platform-browser';
import {TestBed, async, ComponentFixture, inject} from '@angular/core/testing';
import { RouterLinkStubDirective, RouterOutletStubComponent } from './../../../testing/router-stubs';
import { AuthMockService } from '../../../testing/services/auth-mock.service';
import { click } from './../../../testing/utils/click-handler';

import { Auth } from '../../services/index';
import { SidenavComponent } from './sidenav.component';
import { DebugElement } from '@angular/core/src/debug/debug_node';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterTestingModule,
    SlimLoadingBarModule.forRoot(),
    SharedModule
];

describe('SidenavComponent', () => {
    let fixture: ComponentFixture<SidenavComponent>;
    let component: SidenavComponent;
    let authService: AuthMockService;
    let linkDes: DebugElement[];
    let links: RouterLinkStubDirective[];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SidenavComponent,
                RouterLinkStubDirective,
                RouterOutletStubComponent
            ],
            providers: [
                { provide: Auth, useClass: AuthMockService }
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

    it('should call logout from auth service', () => {
        authService = fixture.debugElement.injector.get(Auth) as any;
        const spyLogOut = spyOn(authService, 'logout');

        component.logout();

        expect(spyLogOut).toHaveBeenCalled();
    });

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
