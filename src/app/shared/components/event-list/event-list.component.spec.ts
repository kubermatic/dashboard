import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {SettingsService} from '../../../core/services/settings/settings.service';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';
import {Event} from '../../entity/event';
import {SharedModule} from '../../shared.module';

import {EventListComponent} from './event-list.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      providers: [{provide: SettingsService, useClass: SettingsMockService}],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should return true when there are events', () => {
    component.events = [{} as Event];
    expect(component.hasEvents()).toBeTruthy();
  });

  it('should return false when there are no events', () => {
    expect(component.hasEvents()).toBeFalsy();
  });
});
