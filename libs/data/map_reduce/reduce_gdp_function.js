reduce = function(key, values) {
	result = { yeararray: new Array() }
	for ( var i = 0; i < values.length; i ++ ) {
		for ( var j = 0; j < result.yeararray.length + 1; j ++ ) {
			if ( j == result.yeararray.length ) {
		  		result.yeararray.splice( j, 0, values[i].yeararray[0] );
			} else if ( Number(result.yeararray[j].date) < Number(values[i].yeararray[0].date) ) {
		  		result.yeararray.splice( j, 0, values[i].yeararray[0] );
			}
		}	
	}
	return result;
}

db.world_bank_gdp.mapReduce(map, reduce, {out:"world_bank_gdp_map_reduce_alt" })
