# Title of the Poposal: e.g. **Angular Testing**

**Author**: Eugenia Stempel (@j3ank)

**Status**: Draft proposal; prototype in progress.


## Motivation and Background

*What is the background and why do we want to deplyo it e.g.*

On your project some features need to work. Traditionally people tested them. However, the problem with this is that whenever you change something in your code, you might ruin something. As a result, you need to test everything again and again after each change in your code. Now, that could be troublesome. If you have to conduct 10 tests after each change, then, after only 10 changes you need to execute 100 tests. That takes time. Time is money. Therefore, whenever you can define automatic tests, then instead of going over your test cases each and every time, you can define unit tests which will automatically tell you whether something is wrong. The difference between manual tests and unit tests is like the difference between calculating everything using pen and paper instead of using a calculator. Some tests cannot be automatized, but whenever something can be tested automatically, you need to define unit tests for it.


## Implementation

*How to implment the idea e.g.*

* removing all existing spec.ts files

* add new spec.ts fils step by step for each component 

* add spec.ts files for each service

* working with mocks for the beginning 


How To use it:

* Run „npm install“ and „ng test“

* a separate window in your chrome browser will open

* you can see the the progress in the bowser

* if everything test run successful everything is is fine and you will no error message in the browser and the console 


## Task & effort:

https://github.com/kubermatic/dashboard-v2/issues/365 angular cli testing

https://github.com/kubermatic/dashboard-v2/issues/392 Testing/pages,shared,dashboard folders - about 1 day

https://github.com/kubermatic/dashboard-v2/issues/390 Testing/cluster folder - about 2-3 days

https://github.com/kubermatic/dashboard-v2/issues/393 Testing/wizard - about 3 days

https://github.com/kubermatic/dashboard-v2/issues/394 Testing/add-node -  about 1-2 days

https://github.com/kubermatic/dashboard-v2/issues/395 Testing/sshkey - about 1 day


## Branch:

* currently we are will merge everything in the testing/anguler-cli-testing branch    

