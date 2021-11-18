# core
Server side toolset for creating Node applications.

## Getting Started
 - Add as submodule to your project
   - ```git submodule add https://github.com/JeremyBankes/core.git modules/core```
 - Start using the library!

```js
const core = require('./modules/core/core.js');

const object = { person: { name: { first: 'Jeremy', last: 'Bankes' } } };
const name = core.data.get(object, 'person.name.first', 'string');
const displayDate = core.time.toString(new Date(), true, true, true);
console.log(`Hello, ${name}. Today is ${displayDate}`);
```
