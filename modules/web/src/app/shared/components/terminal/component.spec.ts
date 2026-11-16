// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserModule, By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute} from '@angular/router';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {WebTerminalSocketService} from '@core/services/websocket';
import {ITerminalFrame} from '@shared/model/Terminal';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {ClusterMockService} from '@test/services/cluster-mock';
import {ActivatedRouteStub} from '@test/services/router-stubs';
import {UserMockService} from '@test/services/user-mock';
import {Observable, Subject} from 'rxjs';
import {TerminalComponent} from './component';

class WebTerminalSocketMockService {
  messages$ = new Subject<ITerminalFrame>();
  connect = jest.fn();
  sendMessage = jest.fn();
  close = jest.fn();

  private _connect$ = new Subject<void>();
  private _close$ = new Subject<void>();

  getWebSocketOnConnectObservable$(): Observable<void> {
    return this._connect$.asObservable();
  }

  getWebSocketOnCloseObservable$(): Observable<void> {
    return this._close$.asObservable();
  }

  // the backend sends a message of the "msg" operation
  receiveMessage(data: string): void {
    this.messages$.next({Op: 'msg', Data: data});
  }

  // the backend, or a refused request, closes the connection
  closeConnection(): void {
    this._close$.next();
  }
}

describe('TerminalComponent', () => {
  let component: TerminalComponent;
  let fixture: ComponentFixture<TerminalComponent>;
  let activatedRoute: ActivatedRouteStub;
  let socket: WebTerminalSocketMockService;

  const isSpinnerShown = (): boolean => !!fixture.debugElement.query(By.css('mat-spinner'));
  const shownMessage = (): string =>
    fixture.debugElement.query(By.css('.terminal-placeholder p')).nativeElement.textContent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, MatSnackBarModule, MatProgressSpinnerModule],
      declarations: [TerminalComponent],
      providers: [
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: WebTerminalSocketService, useClass: WebTerminalSocketMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalComponent);
    component = fixture.componentInstance;
    socket = TestBed.inject(WebTerminalSocketService) as unknown as WebTerminalSocketMockService;

    // Fake Data for Cluster
    component.cluster = fakeDigitaloceanCluster();

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      projectId: fakeProject().id,
      clusterId: component.cluster.id,
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the spinner while the terminal pod is provisioned', () => {
    socket.receiveMessage('WEBTERMINAL_POD_PENDING');
    fixture.detectChanges();

    expect(isSpinnerShown()).toBeTruthy();
    expect(shownMessage()).toContain('provisioning your Web Terminal pod');
  });

  it.each([
    ['WEBTERMINAL_AUTHENTICATION_UNSUPPORTED', 'the cluster uses a custom authentication configuration'],
    ['WEBTERMINAL_AUTHENTICATION_DISABLED', 'OpenIDAuthPlugin feature gate'],
    ['WEBTERMINAL_EMAIL_NOT_VERIFIED', 'the email address of your login is not verified'],
    ['CONNECTION_POOL_EXCEEDED', 'concurrent session per user'],
  ])('should show the reason instead of the spinner when the backend answers %s', (status, reason) => {
    socket.receiveMessage(status);
    fixture.detectChanges();

    expect(isSpinnerShown()).toBeFalsy();
    expect(shownMessage()).toContain(reason);

    // the backend closes the connection after the message, which must not replace the reason
    socket.closeConnection();
    fixture.detectChanges();

    expect(isSpinnerShown()).toBeFalsy();
    expect(shownMessage()).toContain(reason);
  });

  it('should stop the spinner when the connection is closed before the terminal is started', () => {
    socket.receiveMessage('WEBTERMINAL_POD_PENDING');
    socket.closeConnection();
    fixture.detectChanges();

    expect(isSpinnerShown()).toBeFalsy();
    expect(shownMessage()).toContain('The web terminal could not be opened');
  });

  it('should stop the spinner when the request for the terminal is refused', () => {
    // a refused request closes the connection without any message
    socket.closeConnection();
    fixture.detectChanges();

    expect(isSpinnerShown()).toBeFalsy();
    expect(shownMessage()).toContain('The web terminal could not be opened');
  });
});
