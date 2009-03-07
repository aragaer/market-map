var cont;
var DB;
var StarMapHolder;
var StarMap;
var RegionName;
var mouseIsOver;
var sizemul = 1;
var GoodsTree;
const neighs = {};

const GoodsFiles = [];
const GoodsTreeView = {  
	rowCount : 0,
	getCellText : function(row,column) {
		return GoodsFiles[row][column.id];
	},
	setTree: function(treebox){ this.treebox = treebox; },
	isContainer: function(row){ return false; },
	isSeparator: function(row){ return false; },
	isSorted: function(){ return false; },
	getLevel: function(row){ return 0; },
	getImageSrc: function(row,col){ return null; },
	getRowProperties: function(row,props){},
	getCellProperties: function(row,col,props){},
	getColumnProperties: function(colid,col,props){}
};  

const Systems = {};
const BuyOrdersHere = {};

var cx, cy;

var dragX, dragY, isDrag = false;

function mapOnLoad() {
	DB = new DBH('map.db', 'CurProcD');
	RegionName = document.getElementById('region-name');
	cont = document.getElementById('reg-container');
	StarMapHolder = document.getElementById('reg-map-holder');
	GoodsTree = document.getElementById('goods-tree');

	StarMapHolder.setAttribute('width', cont.boxObject.width);
	StarMapHolder.setAttribute('height', cont.boxObject.height);
	
	GoodsTree.addEventListener('select', onGoodsSelect, true);
}	

function doCleanUp() {
	if (StarMap)
		StarMapHolder.removeChild(StarMap);
		
	for (i in neighs)
		delete neighs[i];
		
	for (i in Systems)
		delete Systems[i];
}

function processLinks(array) {
	if (!neighs[array[0]])
		neighs[array[0]] = [];
	if (!neighs[array[1]])
		neighs[array[1]] = [];
	
	neighs[array[0]].push(array[1]);
	neighs[array[1]].push(array[0]);
	
	array.splice(0);
}

function loadRegion() {
	var regname = RegionName.value;
	var file = Cc["@mozilla.org/file/directory_service;1"]
			.getService(Ci.nsIProperties)
	    	.get('CurProcD', Ci.nsIFile);
	file.append('data');
	file.append(regname + '.svg');

	if (!file.exists()) {
		alert("Map for region "+regname+" not found");
		return;
	}
		
	doCleanUp();

	var uri = Cc["@mozilla.org/network/io-service;1"]
		.getService(Ci.nsIIOService)
		.newFileURI(file);

	var req = new XMLHttpRequest();
	req.open('GET', uri.spec, false);
	req.send(null);
	StarMap = req.responseXML.getElementById('graph0');
	
	var reg = DB.doSelectQuery('select regionID from mapRegions where regionName="'+regname+'";');
	
	DB.doSelectQuery('select solarSystemID, solarSystemName from mapSolarSystems '
			+'where regionID='+reg,
			function (array) {
				Systems[array[0]] = array[1];
			});
	
	DB.doSelectQuery('select f.solarSystemName, t.solarSystemName '
				+'from mapSolarSystemJumps as j '
				+'left join mapSolarSystems as f on fromSolarSystemID=f.solarSystemID '
				+'left join mapSolarSystems as t on toSolarSystemID=t.solarSystemID '
				+'where j.regionID='+reg+';',
			processLinks);
	
	var transform = StarMap.getAttribute('transform');
	var transl = transform.substr(transform.indexOf('translate')+10); // strlen 'translate('
	transl = transl.substr(0, transl.indexOf(')'));
	var translate = transl.split(', ');
	cx = Math.round(+translate[0]);
	cy = Math.round(+translate[1]);
	var scale = transform.substr(transform.indexOf('scale')+6); // strlen 'scale('
	sizemul = +scale.substr(0, scale.indexOf(','));
	
	StarMapHolder.appendChild(StarMap);
	
	StarMap.setAttribute('width', cont.boxObject.width);
	StarMap.setAttribute('height', cont.boxObject.height);
	
	for (i in Systems)
		document.getElementById(Systems[i]).addEventListener('dblclick', doCover, true);
	
	doDraw();
	getGoodsData();
	
	setInterval("getGoodsData()", 10000);
}

function doDraw() {
//    StarMap.removeEventListener('dblclick', reCenter, true);
    cont.removeEventListener('DOMMouseScroll', changeScale, true);
    cont.removeEventListener('resize', reSize, true);
    cont.removeEventListener('mousemove', dragMove, true);
    cont.removeEventListener('mousedown', dragStart, true);
	
	StarMap.setAttribute('transform',
			'scale('+sizemul+','+sizemul+') '
			+ 'translate('+cx+','+cy+')');

//	var w = cont.boxObject.width;
//	var h = cont.boxObject.height;

//	StarMapHolder.setAttribute('viewBox',
//			(-cx) + " " + (-cy) + " "
//			+ Math.round(w*sizemul) + " "
//			+ Math.round(h*sizemul));
//			
//	println(StarMapHolder.getAttribute('viewBox'));
			
//	cxd.value = cx;
//	cyd.value = cy;
//	smd.value = sizemul;
//	println(StarMap.getAttribute('transform'));
	
    if (isDrag)
	    cont.addEventListener('mousemove', dragMove, true);
	else
	    cont.addEventListener('mousedown', dragStart, true);
    cont.addEventListener('resize', reSize, true);
    cont.addEventListener('DOMMouseScroll', changeScale, true);
//    StarMap.addEventListener('dblclick', reCenter, true);
}

function reSize() {
	StarMapHolder.setAttribute('width', cont.boxObject.width);
	StarMapHolder.setAttribute('height', cont.boxObject.height);
	doDraw();
}

function dragStart(aEvt) {
    if (aEvt.button != 0) {
        return;
    }
    
    isDrag = true;
    
    dragX = aEvt.clientX;
    dragY = aEvt.clientY;
    
    cont.addEventListener("mouseup", dragRelease, true);
    cont.addEventListener("mousemove", dragMove, true);
}

function dragMove(aEvt) {
	cx += Math.round((aEvt.clientX - dragX)/sizemul);
	cy += Math.round((aEvt.clientY - dragY)/sizemul);
	
	doDraw();

    dragX = aEvt.clientX;
    dragY = aEvt.clientY;
    
    if (!mouseIsOver)
    	dragRelease({button : 0});
}

function dragRelease(aEvt) {
    if (aEvt.button != 0) {
        return;
    }
    
    isDrag = false;
    
    cont.removeEventListener("mousemove", dragMove, true);
    cont.removeEventListener("mouseup", dragRelease, true);

    doDraw();
}

function changeScale(aEvt) {
    if (aEvt.detail > 0) {
        sizemul*=0.8;
    } else if (aEvt.detail < 0) {
        sizemul*=1.25;
    }
    
    doDraw();
}

function cover(sys, depth) {
	var res = [sys];
	var queued = [sys];
	var used = {};
	used[sys] = 1;
	
	while (depth-- > 0) {
		queued.map( function (a) {
			neighs[a]
				.filter( function (a) { return !used[a] } )
				.map( function (a) {
					used[a] = 1;
					queued.push(a);
					res.push(a);
				} )
		} );
	}
	
	return res;
}

function getGoodsData() {
	var exports = Cc["@mozilla.org/file/local;1"]
			.createInstance(Ci.nsILocalFile);
	try {
		exports.initWithPath(getCharPref('eoht.exports.dir'));
	} catch (e) {
		return;
	}
	var entries = exports.directoryEntries;
	GoodsFiles.splice(0);
	
	var items = {};
	
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile)
		var name = entry.leafName;
		var record = name.split(/\b-\b/);
		
		if (record[0] != RegionName.value)
			continue;

		var dateparts = record[2].split(/\.| /);
		dateparts.pop(); // 'txt'
		var times = [+dateparts[3].substr(0,2),
				+dateparts[3].substr(2,2),
				+dateparts[3].substr(4,2)];
		var this_date = new Date(dateparts[0], dateparts[1], dateparts[2],
				times[0], times[1], times[2]);

		if (items[record[1]]
				&& this_date.getTime() <= items[record[1]].date.getTime())
			continue;

		items[record[1]] = {
			date	: this_date,
			record	: {
				item 	: record[1],
				file	: entry
			}
		};
	}

	for (i in items)
		GoodsFiles.push(items[i].record);
	
	GoodsTreeView.rowCount = GoodsFiles.length;
	GoodsTree.view = GoodsTreeView;
	
	onGoodsSelect();
}

const headers = ['price', 'volRemaining', 'typeID', 'range', 'orderID',
	'volEntered', 'minVolume', 'bid', 'issued', 'duration', 'stationID',
	'regionID', 'solarSystemID', 'jumps'];

function onGoodsSelect() {
	var row = GoodsTree.currentIndex;
	if (row == -1)
		return;
		
	// open an input stream from file
	var istream = Cc["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Ci.nsIFileInputStream);
	istream.init(GoodsFiles[row].file, 0x01, 0444, 0);
	istream.QueryInterface(Ci.nsILineInputStream);

	var line = {}, lines = [], hasmore;
	do {
		hasmore = istream.readLine(line);
		lines.push(line.value); 
	} while(hasmore);

	istream.close();

	for (i in BuyOrdersHere)
		delete BuyOrdersHere[i];

	lines.shift(); // headers
	
	var ordersprocessed = 0;
	
	lines.forEach(function (line) {
		var fields = line.split(',');
		var record = {};
		fields.pop(); // trailing colon
		for (i in headers)
			record[headers[i]] = fields[i];
		
		if (record.bid == 'False')
			return;
			
		if (record.range < 0)
			record.range = 0;
			
		record.price = +record.price; //magic - convert to number
			
		if (record.range > 40) {
			for (i in Systems) {
				here = Systems[i];
				if (!BuyOrdersHere[here]
						|| BuyOrdersHere[here] < record.price)
					BuyOrdersHere[here] = record.price;
			}
		} else {
			cover(Systems[record.solarSystemID], record.range)
					.forEach(function (here) {
						if (!BuyOrdersHere[here]
								|| BuyOrdersHere[here] < record.price)
							BuyOrdersHere[here] = record.price;
					});
		}
		
		++ordersprocessed;
	});

//	println("Orders processed: "+ ordersprocessed);

	for (var i in BuyOrdersHere) {
		var price = BuyOrdersHere[i];
		var tx = getTextById(i);
		if (tx.firstChild)
			tx.removeChild(tx.firstChild);
			
		tx.appendChild(document.createTextNode(i+" "+price));
	}
}

function getMapElementWithAttrById(id, attr) {
	var el = document.getElementById(id);
	if (!el)
		return null;
	var childs = el.childNodes;
	for (i in childs)
		if (childs[i].getAttribute && childs[i].getAttribute(attr))
			return childs[i];
}

function getTextById(id) {
	return getMapElementWithAttrById(id, 'text-anchor');
}

function getEllipseById(id) {
	return getMapElementWithAttrById(id, 'rx');
}

var highlighted = [];

function paint(sys, col) {
	var el = getEllipseById(sys);
	if (el)
		el.setAttribute('style', "fill:"+col+";stroke:black;");
}

function paintDefault(sys) {
	paint(sys, 'none');
}

function paintGray(sys) {
	paint(sys, '#c0c0c0');
}

function doCover(aEvt) {
	var sys = aEvt.currentTarget.getAttribute('id');
	highlighted.forEach(paintDefault);
	highlighted = cover(sys, document.getElementById('range').value);
	var maxprice = 0;
	highlighted.forEach(function (sys) {
		paintGray(sys);
		if (maxprice < BuyOrdersHere[sys])
			maxprice = BuyOrdersHere[sys];
	});
	
	document.getElementById('max-price').value = maxprice;
}
