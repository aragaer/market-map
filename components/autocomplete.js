const Ci = Components.interfaces;

const CLASS_ID = Components.ID("{6224daa1-71a2-4d1a-ad90-01ca1c08e323}");
const CLASS_NAME = "Simple AutoComplete";
const CONTRACT_ID = "@mozilla.org/autocomplete/search;1?name=simple-autocomplete";

// Implements nsIAutoCompleteResult
function SimpleAutoCompleteResult(searchString, searchResult,
                                  defaultIndex, errorDescription,
                                  results) {
	this._searchString = searchString;
	this._searchResult = searchResult;
	this._defaultIndex = defaultIndex;
	this._errorDescription = errorDescription;
	this._results = results;
}

SimpleAutoCompleteResult.prototype = {
	_searchString: "",
	_searchResult: 0,
	_defaultIndex: 0,
	_errorDescription: "",
	_results: [],

	get searchString() { return this._searchString; },
	get searchResult() { return this._searchResult; },
	get defaultIndex() { return this._defaultIndex; },
	get errorDescription() { return this._errorDescription; },
	get matchCount() { return this._results.length; },
	getValueAt: function(index) { return this._results[index]; },
	getCommentAt: function(index) { return ""; },
	getStyleAt: function(index) { return null },
	getImageAt : function (index) { return ""; },
	removeValueAt: function(index, removeFromDb) {
    	this._results.splice(index, 1);
  	},

	QueryInterface: function(aIID) {
		if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};


// Implements nsIAutoCompleteSearch
function SimpleAutoCompleteSearch() {}

SimpleAutoCompleteSearch.prototype = {
	startSearch: function(searchString, searchParam, result, listener) {
		var results	= searchParam.split(',').filter(
				function (a) { return a.indexOf(searchString) == 0; });

    	var newResult = new SimpleAutoCompleteResult(searchString,
    			Ci.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "", results);
    	listener.onSearchResult(this, newResult);
	},

	stopSearch: function() {},

	QueryInterface: function(aIID) {
		if (!aIID.equals(Ci.nsIAutoCompleteSearch) && !aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};

// Factory
var SimpleAutoCompleteSearchFactory = {
	singleton: null,
	createInstance: function (aOuter, aIID) {
		if (aOuter != null)
			throw Components.results.NS_ERROR_NO_AGGREGATION;
		if (this.singleton == null)
			this.singleton = new SimpleAutoCompleteSearch();
		return this.singleton.QueryInterface(aIID);
	}
};

// Module
var SimpleAutoCompleteSearchModule = {
	registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(CLASS_ID, "Simple AutoComplete",
				"@mozilla.org/autocomplete/search;1?name=simple-autocomplete",
				aFileSpec, aLocation, aType);
	},

	unregisterSelf: function(aCompMgr, aLocation, aType) {
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
	},
  
	getClassObject: function(aCompMgr, aCID, aIID) {
		if (!aIID.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		if (aCID.equals(CLASS_ID))
			return SimpleAutoCompleteSearchFactory;

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	canUnload: function(aCompMgr) { return true; }
};

// Module initialization
function NSGetModule(aCompMgr, aFileSpec) { return SimpleAutoCompleteSearchModule; }
