// Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
import '@angular/localize/init';

import 'jest-preset-angular';
import './test.base.mocks';

// Async operations timeout
jest.setTimeout(15000);
