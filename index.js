"use strict";
const CheckVar = (v, s) => {
	switch (typeof v) {
		case "string":
			return s ? `CHARACTER(v.length)` : "VARCHAR";
			break;
		case "number":
			return v.toString().indexOf(".") == -1 ? "INTEGER" : "DECIMAL"
			break;
		case "boolean":
			return "BOOLEAN";
			break;
		case "object":
			let k = Object.keys(v);
			if(k.indexOf("type") == -1 || !k["type"])throw new Error("Must specify the type of data");
			return k["type"];
		break;
		default:
			throw "Unrecognized Data Type."
	}
}

const handleClauses = (c, s = null) => {
	let statements = [];
	console.log(typeof statements);
	
	switch(typeof c)
	{
		case "object":
			for(let i in c){
				statements.push(i + "=" + (typeof c[i] == 'number' ? c[i] : "'" + c[i] + "'"))
			}
			break;
		case "string":
			return c;
		break;
		case "array":
			if(s)throw "Arrays cannot contain Sub arrays";
			c.forEach(v => {
				console.log(v);
				
				statements.push(handleClauses(v, true))
			})
		break;
		default:
			throw "Undefined Type. it can only be a String, Array or Object"
	}
	return statements.join(" AND ")
}

const cleanParam = p => {
	p.replace("'", "\'");
	p.replace('"', '\"');
	p.replace("/", "\/");
}

/** Class To open a Database */
class DataBase {
	/**
	 * Creates an instance of DataBase.
	 * @param {string} [location = ./] - the relative link to the location that the databases are located in
	 * @memberof DataBase
	 */
	constructor(location) {
		this.dataBase = require("sqlite");
		this.location = location || "./";
		this.tables;
	}
	/**
	 * Opens a database or creates one if it doesnt exist.
	 * @param {string} n 
	 * @param {string} [location = ./] 
	 * @returns New Management Instance
	 * @memberof DataBase
	 */
	async open(n, location) {
		this.location = location || this.location
		await this.dataBase.open((this.location.endsWith("/") ? this.location : this.location + "/") + `${n}.sqlite`);
		let ret = new Mgnt();
		await ret.listTables()
		return ret;
	}
	/**
	 * Closes the Database
	 * @memberof DataBase
	 */
	close() {
		this.dataBase.close();
	}
}
/**
 * Used for Managing your tables within a Database.
 * @class Mgnt
 * @extends {DataBase}
 */
class Mgnt extends DataBase {
	/**
	 * Creates an instance of Mgnt.
	 * @param {string} [tableName] - Name of the table. (only used )
	 * @param {bool} [shouldRunList = true] - if the management class should list all tables in a database  
	 * @memberof Mgnt
	 */
	constructor(tableName, shouldRunList = true) {
		super();
		this.tableName = tableName;
		this.tables;
		shouldRunList && this.listTables();
	}
	/**
	 * Lists all the tables in a database.
	 * @returns {promise} Map of all tables
	 * @memberof Mgnt
	 */
	async listTables() {	
		const r = await this.dataBase.all("SELECT name FROM sqlite_master WHERE type = 'table'");
		let ts = new Map();
		let tablePromises = [];
		let colPromises = [];
		for (const v of r) {
			tablePromises.push(this.open(v.name, false));
		}
		for (const a of await Promise.all(tablePromises)) {
			ts.set(a.tableName, a);
			colPromises.push(a._initColumns());
		}
		await Promise.all(colPromises);
		this.tables = ts;
		return ts;
	}
	/**
	 * Creates a Database
	 * @param {string} name 
	 * @param {object} collumns  - The Collumns of a database. use {name: type}. 
	 * @param {bool} [strict = false] - Enables Strict mode 
	 * @memberof Mgnt
	 */
	async create(name, collumns, strict) {
		name = name.split(" ").join("");
		let variables = [];
		for (let i in collumns) {
			variables.push(`${i} ${CheckVar(collumns[i])}`)
		}
		this.tableName = name;
		await this.dataBase.run(`CREATE TABLE IF NOT EXISTS ${name} (${variables.join(", ")})`)
		let ret = new Table(name);
		await ret._initColumns();
		return 	
	}
	/**
	 * Opens a table and returns the table class
	 * @param {any} [name] 
	 * @param {boolean} [listTables=false] 
	 * @returns {class} Table
	 * @memberof Mgnt
	 */
	open(name = this.tableName, listTables = false) {
		return new Table(name, listTables);
	}
	/**
	 * Drops a table.
	 * @param {any} [n=this.tableName] 
	 * @returns {promise}
	 * @memberof Mgnt
	 */
	drop(n = this.tableName) {
		return this.dataBase.run("DROP TABLE IF EXISTS " + n);
	}
}
/**
 * Class to write and read from tables
 * @class Table
 * @extends {Mgnt}
 */
class Table extends Mgnt {
	/**
	 * Creates an instance of the Table class
	 * @param {string} name - Name of the table
	 * @param {bool} listTables - if the Mgnt class shoudl list all tables
	 * @memberof Table
	 */
	constructor(name, listTables) {
		super(name, listTables);
		this.columns;
		this._initColumns();
	}

	/**
	 * Creates a Array of Collumn information
	 * @returns {array} Collumn info of a table
	 * @memberof Table
	 */
	async _initColumns(){
	let t = await this.dataBase.all(`PRAGMA table_info(${this.tableName})`)
	t = t.map(v => {
		let r = {};
		r.id = v.cid;
		r.name = v.name;
		r.type = v.type;
		return r;
	});
	this.columns = t;
	return t;
	}

	/**
	 * Reads from a Database
	 * @param {array}  [values] - Array of values to read out of the database
	 * @param {any} [clauses] - Statements of what to filter
	 * @returns {array} - Database Entries
	 * @memberof Table
	 */
	read(values, clauses) {
		let query = `SELECT ${(!values || values.length == 0) ? "*" : values} FROM ${this.tableName}`
		let where = " WHERE "

		return this.dataBase.all(query)
	}
	
	/**
	 * runns a Sql Query
	 * @param {string} query - Sql Query 
	 * @returns {any} - Result
	 * @memberof Table
	 */
	async run(s){
		return await this.dataBase.run(s);
	}
	
	/**
	 * writes to a table
	 * @param {array} Variables - Array of Collumn names to write into 
	 * @param {array} Values - Array with their Assoicated variables
	 * @returns table class
	 * @memberof Table
	 */
	async write(n, d) {
		await this.dataBase.run(`INSERT INTO ${this.tableName} (${(n.join(", "))}) VALUES (${(n.map(() => {return "?"}).join(", "))})`, (d));
		return this;
	}

	async delete(n) {
		return this.dataBase.run(`DELETE  FROM ${this.tableName}${n ? " WHERE " + n : ""}`)
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
		return this.dataBase.run(query)
	}
}

module.exports = DataBase;
module.exports.test = handleClauses;