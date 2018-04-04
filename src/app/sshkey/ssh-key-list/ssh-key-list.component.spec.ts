import { SharedModule } from './../../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SshKeyListComponent } from './ssh-key-list.component';
import { SshKeyItemComponent } from './ssh-key-item/ssh-key-item.component';
import { fakeSSHKeys } from '../../testing/fake-data/sshkey.fake';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';

const modules: any[] = [
  BrowserModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  SharedModule
];

describe('SshKeyListComponent', () => {
  let fixture: ComponentFixture<SshKeyListComponent>;
  let component: SshKeyListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SshKeyListComponent,
        SshKeyItemComponent
      ],
      providers: [
        { provide: ApiService, useClass: ApiMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SshKeyListComponent);
    component = fixture.componentInstance;
  });

  it('should create the sshkey list cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should render sshkey items', fakeAsync(() => {
    component.sshKeys = fakeSSHKeys;

    tick();
    fixture.detectChanges();

    const deItems = fixture.debugElement.queryAll(By.css('.sshkey-item'));
    expect(deItems.length).toBe(component.sshKeys.length);
  }));

  it('should delete sshkey', () => {
    component.sshKeys = fakeSSHKeys;
    component.sortedData = fakeSSHKeys;

    const initialLength = component.sortedData.length;
    const deletedItem = component.sortedData[0];

    fixture.detectChanges();
    component.deleteSSHKey(deletedItem);
    const foundItem = component.sortedData.find(item => item === deletedItem);

    expect(component.sortedData.length).toBe(initialLength - 1, 'should delete item from the array');
    expect(foundItem).toBeUndefined('should not find deleted item in the array');
  });

  it('should render sshkeys when they are', () => {
    component.sortedData = [];
    fixture.detectChanges();
    let sshKeyListDe = fixture.debugElement.query(By.css('.km-card-list-no-keys'));

    expect(sshKeyListDe).toBeTruthy('should not render sshkey list if it is not obtained');

    component.sortedData = fakeSSHKeys;
    fixture.detectChanges();
    sshKeyListDe = fixture.debugElement.query(By.css('.sshkey-list'));

    expect(sshKeyListDe).not.toBeNull('should render sshkey list if it is');
  });
});
