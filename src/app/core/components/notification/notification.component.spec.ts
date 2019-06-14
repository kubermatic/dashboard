import {MockNgRedux, NgReduxTestingModule} from '@angular-redux/store/testing';
import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {NotificationsService, SimpleNotificationsModule} from 'angular2-notifications';
import {ClipboardModule} from 'ngx-clipboard';
import {NotificationToast, NotificationToastType} from '../../../shared/interfaces/notification-toast.interface';
import {NotificationMockService} from '../../../testing/services/notification-mock.service';
import {NotificationComponent} from './notification.component';

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
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            NotificationComponent,
          ],
          providers: [
            {provide: NotificationsService, useClass: NotificationMockService},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
  });

  it('should create the Notification Component', () => {
    expect(component).toBeTruthy();
  });

  it('should call success notification', fakeAsync(() => {
       const notificationService: NotificationMockService =
           fixture.debugElement.injector.get(NotificationsService) as any;
       const spyNotification = spyOn(notificationService, 'success');

       setMockNgRedux(fixture, {type: NotificationToastType.success, title: 'Success', content: 'Success'});

       tick();
       fixture.detectChanges();

       expect(spyNotification).toHaveBeenCalled();
     }));

  it('should call alert notification', fakeAsync(() => {
       const notificationService: NotificationMockService =
           fixture.debugElement.injector.get(NotificationsService) as any;
       const spyNotification = spyOn(notificationService, 'alert');

       setMockNgRedux(fixture, {type: NotificationToastType.alert, title: 'Alert', content: 'Alert'});

       tick();
       fixture.detectChanges();

       expect(spyNotification).toHaveBeenCalled();
     }));

  it('should call info notification', fakeAsync(() => {
       const notificationService: NotificationMockService =
           fixture.debugElement.injector.get(NotificationsService) as any;
       const spyNotification = spyOn(notificationService, 'info');

       setMockNgRedux(fixture, {type: NotificationToastType.info, title: 'Info', content: 'Info'});

       tick();
       fixture.detectChanges();

       expect(spyNotification).toHaveBeenCalled();
     }));

  it('should call error notification', fakeAsync(() => {
       const notificationService: NotificationMockService =
           fixture.debugElement.injector.get(NotificationsService) as any;
       const spyNotification = spyOn(notificationService, 'error');

       setMockNgRedux(fixture, {type: NotificationToastType.error, title: 'Error', content: 'Error'});

       tick();
       fixture.detectChanges();

       expect(spyNotification).toHaveBeenCalled();
     }));
});
