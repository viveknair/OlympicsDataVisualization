require 'net/http'
require 'mongo'
require 'rexml/document'
require 'pp'

def mine_gdp(type)
	mconnection = Mongo::Connection.new
	database = mconnection['rackspace_hack']
	coll = database['world_bank']
	insert_coll = database['world_bank_totalpop']
	
	iso_values = []
	coll.find do |cursor|
		cursor.each { |country| iso_values << country['wb:iso2Code'] }
	end

	iso_uris = iso_values.map { |iso| URI("http://api.worldbank.org/countries/#{iso}/indicators/#{type}") }
	
	mongo_query = {}
	iso_uris.map do |iso_uri|
		raw_data = Net::HTTP.get(iso_uri)
		xml = REXML::Document.new(raw_data)

		xml.elements.each('wb:data/wb:data') do |s|
			mongo_query = {}
			%w(wb:indicator wb:country wb:date wb:value wb:decimal).each do |type|
				mongo_query[type.intern] = s.elements[type].text		
			end
			insert_coll.insert(mongo_query)
		end
	
	end
end

mine_gdp("SP.POP.TOTL")
