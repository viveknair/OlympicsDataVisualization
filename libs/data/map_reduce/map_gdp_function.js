map = function() {
  year_array = new Array()
	year_array.push({ date: this['wb:date'], gdp: this['wb:value'] })
	emit({ country: this['wb:country'] }, { yeararray: year_array  })
}
