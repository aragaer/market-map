const OPENED = {};
const FREED = {};
const StorageService = Cc["@mozilla.org/storage/service;1"]
	.getService(Ci.mozIStorageService);
const DirectoryService = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties);

var DB_HOST;

function DB_INIT() {
	DB_HOST = document.getElementById('databases');
	DB_HOST.DBH_real = DBH_real;
	DB_HOST.doSelectQuery_real = doSelectQuery_real;
}

function get_db_dir(where) {
    var file = DirectoryService.get(where, Ci.nsIFile);
    file.append('data');
    return file;
}

function DBH_real(db_name, where) {
    if (OPENED[db_name])
        if (FREED[db_name]) {
            FREED[db_name] = 0;
            return OPENED[db_name];
        } else
            return null;

    var file = get_db_dir(where || 'ProcD');
    file.append(db_name);
    println("opening database "+file.path);
    var conn = StorageService.openDatabase(file);
    OPENED[db_name] = conn;
    conn.executeSimpleSQL("PRAGMA synchronous = OFF");
    conn.executeSimpleSQL("PRAGMA temp_store = MEMORY");
    return conn;
}

function doSelectQuery_real(conn, query, recHandler) {
    var rv = new Array;
    println("Executing "+query);
    var statement = conn.conn.createStatement(query);
    while (statement.executeStep()) {
        var c;
        var thisArray = new Array;
        for (c = 0; c < statement.numEntries; c++) {
            thisArray.push(statement.getString(c));
        }
        if (recHandler) {
            recHandler(thisArray);
        }
        if (thisArray.length)
	        rv.push(thisArray);
    }
    statement.reset();
    return rv;
}

