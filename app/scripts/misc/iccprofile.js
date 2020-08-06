

/**
 * A class for reading ICC profile data.
 * Based on the ICC profile specification from http://www.color.org/
 * @author januszsobolewski
 * 
 */	
function ICCProfile(data)
{
    var ASCP_SIGNATURE = 0x61637370;
    
    var _prefferedCMMType,
    	_profileVersionNumber,
    	_deviceClass,
    	_pcs,
    	_dateCreated,
    	_platformSignature,
    	_profileFlags,
    	_deviceManufacturer,
    	_deviceModel,
    	_renderingIntent,
    	_creatorSignature,
    	_tags,
    	_desc,
		_cprt,
		_dmdd,
		_dmnd,
		_vued,
		_colourSpaceOfData;
	
	var _data = data;
    
	function readDateTimeNumber(data)
    {
        var dc = [];
        for(var i=0;i<6;i++)
            dc.push(data.readUnsignedShort());
          
        var result = new Date();
        result.setUTCFullYear(dc[0], dc[1] - 1, dc[2]);
        result.setUTCHours(dc[3], dc[4], dc[5]);
        return result; 
    }
    
    function readTag(data)
    {
        return {signature: data.readMultiByte(4),
                offset: data.readUnsignedInt(),
                size: data.readUnsignedInt() };
    }
	
	function readTagDataAsString(tagSignature)
	{
		var tag = findTag(tagSignature);
		var result = null;
		if (tag)
		{
			_data.position = tag.offset;
			//read tag type
			var type = _data.readMultiByte(4);
			switch(type)
			{
				case 'text':
					result = readTextTypeTag(tagSignature);
					break;
				case 'desc':
					result = readDescTypeTag(tagSignature);
					break;
				case 'mluc':
					var names = readMlucTypeTag(tagSignature);
					if (names.length>0)
						result = names[0].name;
					break;
			}
		}
		return result;
	}
	
	function readTextTypeTag(tagSignature)
	{
		var tag = findTag(tagSignature);
		var result = null;
		if (tag)
		{
			_data.position = tag.offset + 8;
			result = _data.readMultiByte(tag.size-8);
		}
		return result;
	}
	
	function readDescTypeTag(tagSignature)
	{
		var tag = findTag(tagSignature);
		var result = null;
		if (tag)
		{
			_data.position = tag.offset + 8;
			//read description length
			var len = _data.readUnsignedInt();
			result = _data.readMultiByte(len-1);
		}
		return result;
	}
	
	function readMlucTypeTag(tagSignature)
	{
		var tag = findTag(tagSignature);
		var result = new Array();
		if (tag)
		{
			_data.position = tag.offset + 8;
			//read number of names
			var numOfNames = _data.readUnsignedInt();
			for(var i=0;i<numOfNames;i++)
			{
				var nameRecordSize = _data.readUnsignedInt();
				var langCode = _data.readMultiByte(2);
				var countryCode = _data.readMultiByte(2);
				var len = _data.readUnsignedInt();
				var offset = _data.readUnsignedInt();
				
				result.push( { size: nameRecordSize,
									landCode: langCode,
									countryCode: countryCode,
									len: len,
									offset: offset } );
			}
			
			for(i=0;i<numOfNames;i++)
			{
				var rec = result[i];
				_data.position = tag.offset + rec.offset;
				//rec.name = _data.readMultiByte(rec.len, "unicodeFFFE");
				rec.name = _data.readUTFBytes(rec.len);
			}
		}
		return result;
	}
	
	function findTag(tagSignature)
	{
		var result = null;
		for (var i = 0; i < _tags.length; i++) {
			var tag = _tags[i];
			if (tag.signature==tagSignature)
			{
				result = tag;
				break;
			}
		}
		return result;
	}
	
    
    function readICCHeader()
    {
		_data.endian = Endian.BIG_ENDIAN;
		_data.position = 0;
        var profileSize = _data.readUnsignedInt();
        
        //4 bytes - Profile size
        
        //4 bytes - Preferred CMM Type
        //_prefferedCMMType = data.readUnsignedInt();
		_prefferedCMMType = _data.readMultiByte(4);
        
        //4 bytes - Profile version number
        _profileVersionNumber = _data.readUnsignedInt();
        
        //4 bytes - Profile/Device Class
        _deviceClass = _data.readMultiByte(4);

        //4 bytes - Colour space of data (possibly a derived space) [i.e. “the canonical input space”]
        _colourSpaceOfData = _data.readMultiByte(4);

        //4 bytes - Profile Connection Space (PCS) [i.e. “the canonical output space”]
        _pcs = _data.readUnsignedInt();
        
        //12 bytes - Date and time this profile was first created
        _dateCreated = readDateTimeNumber(_data);
        
        //4 bytes - ‘acsp’ (61637370h) profile file signature
        var ascp = _data.readUnsignedInt();
        if (ascp!=ASCP_SIGNATURE)
            throw new Error("It doesn't seem to be a valid ICC profile");
        
        //4 bytes - Primary Platform signature
        _platformSignature = _data.readMultiByte(4);
        
        //4 bytes - Profile flags to indicate various options for the CMM such as distributed processing and caching options
        _profileFlags = _data.readUnsignedInt();
        
        //4 bytes - Device manufacturer of the device for which this profile is created
        _deviceManufacturer = _data.readMultiByte(4);
        
        //4 bytes - Device model of the device for which this profile is created
        _deviceModel = _data.readMultiByte(4);
        
        //8 bytes - Device attributes unique to the particular device setup such as media type
        //skip device attributes
        _data.position += 8;
        
        //4 bytes - Rendering Intent
        _renderingIntent = _data.readUnsignedInt();
        
        //12 bytes - The XYZ values of the illuminant of the Profile Connection Space. This must correspond to D50.
        //skip it
        _data.position += 12;
        
        //4 bytes - Profile Creator signature
        _creatorSignature = _data.readMultiByte(4);
        
        //16 bytes - Profile ID
        _data.position += 16;
        
        //28 bytes - Bytes reserved for future expansion - must be set to zero (3/ 0 of ISO 646)
        _data.position += 28;
        
        //read tag table
        var tagCount = _data.readUnsignedInt();
        _tags = [];
        for(var i=0;i<tagCount;i++)
        {
			var tag = readTag(_data); 
            _tags.push(tag);
			//trace(tag.signature);
        }
		
		_desc = readTagDataAsString("desc");
		_cprt = readTagDataAsString("cprt");
		_dmdd = readTagDataAsString("dmdd");
		_dmnd = readTagDataAsString("dmnd");
		_vued = readTagDataAsString("vued");
	}

	readICCHeader();
	this.desc = _desc;
	this.cprt = _cprt;
	this.dmdd = _dmdd;
	this.dmnd = _dmnd;
	this.vued = _vued;
	this.dateCreated = _dateCreated;
     
}
