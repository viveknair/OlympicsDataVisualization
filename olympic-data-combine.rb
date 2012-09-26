require 'pp'
require 'ruby-debug'

require 'net/http'
require 'mongo'
require 'rexml/document'
require 'json'

Debugger.start

def olympic_combiner
	# Load olympic data into memory
	olympic_array = JSON.parse(File.read('libs/data/olympics.json'))

	# Load the main hash into memory
	main_hash = JSON.parse(File.read('libs/data/world_names_combined.json'))

	puts olympic_array.inspect
	puts main_hash.inspect

	main_hash['features'].each_with_index do |country, index|
		country_information = country['information']
		if country_information		
			iso_code = country_information['wb:iso2Code']
			olympic_array.each do |olympic_country|
				olympic_iso_code = olympic_country['ISO_country_code']
				puts "Olympic #{olympic_iso_code} and country #{olympic_country['Country_name']} - Main #{iso_code} and country #{country_information['wb:name']}"
				if olympic_iso_code == iso_code
					main_hash['features'][index]['information']['gold_medals'] = olympic_country['Gold_medals']
					main_hash['features'][index]['information']['silver_medals'] = olympic_country['Silver_medals']
					main_hash['features'][index]['information']['bronze_medals'] = olympic_country['Bronze_medals']
					main_hash['features'][index]['information']['gdp'] = olympic_country['2011_GDP']
					main_hash['features'][index]['information']['male_count'] = olympic_country['Male_count']
					main_hash['features'][index]['information']['female_count'] = olympic_country['Female_count']
					main_hash['features'][index]['information']['population'] = olympic_country['2010_population']
				end
			end
		end
	end

	File.open("libs/data/world-names-combined-olympics.json", "w") { |f| f.write(main_hash.to_json) }

end

module JSON
	def parse_to_openstruct(hash)
		raw_hash = self.parse(hash)
		raw_hash.to_openstruct
	end
end

class Hash
 def to_openstruct
   mapped = {}
   each{ |key,value| mapped[key] = value.to_openstruct }
   OpenStruct.new(mapped)
 end
end

olympic_combiner
