import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {SharedModule} from '../../shared.module';
import {TagListComponent} from './tag-list.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('TagListComponent', () => {
  let fixture: ComponentFixture<TagListComponent>;
  let component: TagListComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [...modules],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TagListComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});
