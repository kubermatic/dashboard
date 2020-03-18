import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, EventEmitter, forwardRef, Input, OnDestroy, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-tag-list',
  templateUrl: './tag-list.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagListComponent),
      multi: true,
    },
  ],
})

export class TagListComponent implements OnDestroy, ControlValueAccessor {
  @Input() title = 'Tags';
  @Input() tags: string[] = [];
  @Output() tagsChange = new EventEmitter<string[]>();
  addOnBlur = true;
  selectable = false;
  removable = true;
  form = new FormGroup({tags: new FormControl([])});
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  private _unsubscribe = new Subject<void>();

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._updateTags();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
    this._updateTags();
  }

  private _updateTags(): void {
    // Emit the change event.
    this.tagsChange.emit(this.tags);
  }

  onTouched(): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
