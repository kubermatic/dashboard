/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../reducers/index";

import { NotificationComponent } from "./notification.component";
import {SimpleNotificationsModule} from "angular2-notifications";
import {RouterTestingModule} from "@angular/router/testing";

describe("NotificationComponent", () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        SimpleNotificationsModule
      ],
      declarations: [ NotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
