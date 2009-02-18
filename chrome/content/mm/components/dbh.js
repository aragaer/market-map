function DBH(db_name, where) {
	this.conn = DB_HOST.DBH_real(db_name, where);
}

DBH.prototype.doSelectQuery = function(query, recHandler) {
	return DB_HOST.doSelectQuery_real(this, query, recHandler);
}

