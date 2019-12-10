import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatChipInputEvent} from '@angular/material/chips';

@Component({
  selector: 'km-tag-list',
  templateUrl: './tag-list.component.html',
})

export class TagListComponent {
  @Input() title = 'Tags';
  @Input() tags: string[] = [];
  @Output() tagsChange = new EventEmitter<object>();
  addOnBlur = true;
  selectable = false;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

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
}
