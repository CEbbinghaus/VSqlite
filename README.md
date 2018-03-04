

# VSqlite
[![npm][download-badge]][npm] [![David][dep-badge]][dep-link]<br>
[![NPM][large-badge]][stats-link]
A Node package to generate ineract with sqlite without knowing any sql. Its a wrapper that allows you to not need to know any sql.

## Installation

```sh
npm i vsqlite
```

## Use
```js
const DataBase = require("vsqlite")
let db = new DataBase();
let dataBase = db.open("test");
let tableList = await dataBase.listTables().map(v => v.name);
let table = await db.create("newTable", {name: "john", id: '423178321'});
await table.write(["name","id"], ["Johnny", "83213213"]);
let res = await table.read();
console.log(res);
```

or 

```js
const DataBase = require("vsqlite")
let db = new DataBase();
db.open("test").then(dataBase => {
    let tableList = await dataBase.listTables().map(v => v.name);
    db.create("newTable", {name: "john", id: '423178321'}).then(table => {
        table.write(["name","id"], ["Johnny", "83213213"]);
        table.read().then(console.log);
    })
})
```


## Contact
- [Github](http://www.github.com/cebbinghaus)
- [Discord](https://discord.gg/KzXN4Tw)
- [Email](mailto:cebbinghaus@live.de)

### Licence

This software is licenced under the [GNU LGPLv3](https://choosealicense.com/licenses/lgpl-3.0/) Licence


[npm]: https://npmjs.org/package/vsqlite
[large-badge]: https://nodei.co/npm/vsqlite.png?downloads=true&downloadRank=true&stars=true
[stats-link]: https://nodei.co/npm/vsqlite/
[version-badge]: https://versionbadge.now.sh/vsqlite.svg
[download-badge]: https://img.shields.io/npm/dt/vsqlite.svg?maxAge=3600
[build-badge]: https://api.travis-ci.org/cebbinghaus/vsqlite.svg?branch=master
[build-link]: https://travis-ci.org/CEbbinghaus/VSquite
[dep-badge]: https://travis-ci.org/CEbbinghaus/VSquite.svg
[dep-link]: https://david-dm.org/cebbinghaus/vsqlite
[coverage-link]: https://coveralls.io/github/cebbinghaus/vsqlite?branch=master
[unpkg-link]: https://unpkg.com/
