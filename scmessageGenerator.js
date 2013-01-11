function scmsgGenerator(dbName){

	var scmsgFields = {};

    var scmessage = new SCFile("scmessage");
    var datadict = new SCFile("datadict");

    if(datadict.doSelect("name=\"" + dbName + "\"") == RC_SUCCESS){
    	
    	for (var i = 0; i < datadict.fields.length(); i++) {
    		
    		scmsgFields[datadict.fields[i]] = datadict.captions[i];
    		
    		scmessage["syslanguage"] = "en";
    		scmessage["class"] 		 = "Caption:"+dbName;
    		scmessage["message.id"]  =  datadict.fields[i];
    		scmessage["message"]     =  datadict.captions[i];

    		scmessage.doSave();
    		print("Caption scmessage generated for field: "+datadict.fields[i]);

    	}	

    }

}

//scmsgGenerator("cm3r");
//print("approved.groups : "+system.functions.scmsg("approved.groups","Caption:cm3r",[]));