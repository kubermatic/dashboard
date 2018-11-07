import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationToast, NotificationToastType } from './../../../shared/interfaces/notification-toast.interface';
import { NotificationMockService } from './../../../testing/services/notification-mock.service';

import { NotificationsService, SimpleNotificationsModule } from 'angular2-notifications';
import { ClipboardModule } from 'ngx-clipboard';
import { NotificationComponent } from './notification.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  ClipboardModule,
  SimpleNotificationsModule.forRoot(),
];

function setMockNgRedux<T>(fixture: ComponentFixture<T>, toast: NotificationToast): void {
  const appLoader = MockNgRedux.getSelectorStub(['notification', 'toast']);
  appLoader.next(toast);
  appLoader.complete();
}

describe('NotificationComponent', () => {
  let fixture: ComponentFixture<NotificationComponent>;
  let component: NotificationComponent;

  beforeEach(() => {
    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        NotificationComponent,
      ],
      providers: [
        { provide: NotificationsService, useClass: NotificationMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
  });

  it('should create the Notification Component', () => {
    expect(component).toBeTruthy();
  });

  it('should call success notification', fakeAsync(() => {
    const notificationService: NotificationMockService = fixture.debugElement.injector.get(NotificationsService) as any;
    const spyNotification = spyOn(notificationService, 'success');

    setMockNgRedux(fixture, { type: NotificationToastType.success, title: 'Success', content: 'Success' });

    tick();
    fixture.detectChanges();

    expect(spyNotification).toHaveBeenCalled();
  }));
});
