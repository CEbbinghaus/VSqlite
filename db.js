const CheckVar = v => {
	switch (typeof v) {
		case "string":
			return "VARCHAR"
			break;
		case "number":
			return v.toString().indexOf(".") == -1 ? "INTEGER" : "DECIMAL"
			break;
		case "boolean":
			return "BOOLEAN";
			break;
		default:
			throw "Unrecognized Data Type."
	}
}


class DataBase {
	constructor(name) {
		this.dataBase = require("sqlite");
		this.tables;
	}
	async open(n) {
		await this.dataBase.open(`./databases/${n}.sqlite`);
		return new Mgnt(); // This create a new instance.
	}

	close() {
		this.dataBase.close();
	}
}

class Mgnt extends DataBase {
	constructor(tableName, shouldRunList) {
		super();
		this.tableName = tableName;
		this.tables;
		!shouldRunList && this.listTables();
	}
	async listTables() {	
		const r = await this.dataBase.all("SELECT name FROM sqlite_master WHERE type = 'table'");
		let ts = new Map();
		let promises = [];
		for (const v of r) {
			promises.push(this.open(v.name, true));
		}
		for (const a of await Promise.all(promises)) {
			ts.set(a.tableName, a);
		}
		this.tables = ts;
		return ts;
	}
	async create(name, object) {
		name = name.split(" ").join("");
		let variables = [];
		for (let i in object) {
			variables.push(`${i} ${CheckVar(object[i])}`)
		}
		this.tableName = name;
		await this.dataBase.run(`CREATE TABLE IF NOT EXISTS ${name} (${variables.join(", ")})`)
		return new Table(name);
	}
	open(name = this.tableName, tesnt = false) {
		return new Table(name, tesnt);
	}
	drop(n = this.tableName) {
		return this.dataBase.run("DROP TABLE IF EXISTS " + n);
	}
}
class Table extends Mgnt {
	constructor(name, tesnt) {
		super(name, tesnt);
		this.colums;
		this._initColumns();
	}
	async _initColumns(){
		//let t = await this.dataBase.all(`SELECT name FROM ${this.tableName} WHERE type = 'column'`);
	}

	read(g, s) {
		let query = `SELECT ${(!g || g.length == 0) ? "*" : g} FROM ${this.tableName}` // That's pretty clever
		let where = " WHERE "
		switch(typeof s)
		{
			case "object":
				if(s.length)return query += where + s.join(" AND ");
				let statements = [];
				for(let i in s){
					statements.push(i + "=" + (typeof s[i] == 'number' ? s[i] : "'" + s[i] + "'"))
				}
				query += where + statements.join(" AND ")
			break;
			case "string":
					query += where + s;
			break;
			case "array":
				
				break;
			case "undefined":
			break;
			default:
		}
		//if (s) query += " WHERE " + s;
		return this.dataBase.all(query)
	}
	async write(n, d) {
		await this.dataBase.run(`INSERT INTO ${this.tableName} (${n.join(", ")}) VALUES (${n.map(() => {return "?"}).join(", ")})`, d);
		return this;
	}
	delete(n) {
		return this.dataBase.run(`DELETE  FROM ${this.tableName} WHERE ${n}`)
	}
	
	async edit(clause, values){
		let query = `UPDATE ${this.tableName} SET ${values} WHERE ${clause}`
		// let where = " WHERE "
		// switch(typeof clause)
		// {
		// 	case "object":
		// 		if(s.length)return query += where + s.join(" AND ");
		// 		let statements = [];
		// 		for(let i in s){
		// 			statements.push(i + "=" + (typeof s[i] == 'number' ? s[i] : "'" + s[i] + "'"))
		// 		}
		// 		query += where + statements.join(" AND ")
		// 	break;
		// 	case "string":
		// 	console.log("works");
		// 			query += where + clause;
		// 	break;
		// 	case "undefined":
		// 	break;
		// 	default:
		// }
		console.log(query);
		return this.dataBase.run(query)
	}
}

module.exports = DataBase;