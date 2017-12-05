/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialModule } from '@angular/material';
import { ClusterListComponent } from './cluster-list.component';
import { ClusterItemComponent } from "./cluster-item/cluster-item.component";
import {Auth} from "../../core/services";
import {ApiService} from "app/core/services/api/api.service";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Http, HttpModule, ConnectionBackend} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
describe('ClusterListComponent', () => {
  let component: ClusterListComponent;
  let fixture: ComponentFixture<ClusterListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ClusterListComponent,
        ClusterItemComponent
      ],
      imports: [
        MaterialModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule

      ],
      providers: [
        ApiService,
        Auth,
        Http,
        ConnectionBackend
      ]
    })
    .compileComponents()
    .then(() => { });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
