/**
     * templateInfo			
     * caption 		: 4		
     * display 		: 6		
     * field 		: 1		
     * fieldUsage 	: 7		
     * globallist 	: 5		
     * type 		: 2		
     * value 		: 3		
     *
     */

var IGNORE_FIELDS={ "#operator":"",
					"sysmodtime":"",
					"sysmoduser":"",
					"sysmodcount":"",
					"date.entered":"" };

function diff( $L_diff_result, $L_template_current, $L_template_modified, $L_template_save ){

	var tempInfoCurrent  = $L_template_current.templateInfo;
	var tempInfoModified = $L_template_modified.templateInfo;
	var tempInfoSave 	 = $L_template_save.templateInfo;
	var diffContent		 = $L_diff_result.conflicts;
	var userContent		 = $L_diff_result.usermodified;

	var userXbg   = vars.$userXbg;
	var bgXsave   = vars.$bgXsave;
	var userXsave = vars.$userXsave;

	//1:conflicts; 2:no conflict; 3:system conflict
	var rc = 2;

	var lng = system.functions.lng(system.functions.denull( tempInfoCurrent ));

	var pos = 0;
	var upos = 0;

	try{

		for( var i=0; i< lng; i++){
	
			var valueCurrent  = system.functions.str( tempInfoCurrent[i].value );
			var valueModified = system.functions.str( tempInfoModified[i].value );
			var valueSave 	  = system.functions.str( tempInfoSave[i].value);
	
			// Conflict fields
			if( (valueCurrent != valueSave) && (valueModified != valueSave) && (valueCurrent != valueModified) ){

				if( tempInfoCurrent[i].field in IGNORE_FIELDS ) {
					userXbg.push(i);
					continue;
				}

				// determine if the conflict is on system fields, if it is, then stop all the rest works.
				if(tempInfoCurrent[i].fieldUsage == "1") {
					rc = 3;
					return rc;
				}

				rc = 1;
				
				// To construct the diffContent, then show it in the conflict fields sub-format
				// Caption
				diffContent[pos].caption 	= tempInfoCurrent[i].caption;
				// Original display value
				diffContent[pos].origin     = tempInfoSave[i].display;
				// Unsaved display value
				diffContent[pos].unsaved    = tempInfoCurrent[i].display;
				// Database display value
				diffContent[pos].dbvalue 	= tempInfoModified[i].display;
				// Field type
				diffContent[pos].type 		= tempInfoCurrent[i].type;
				// Field index in template
				diffContent[pos].idx		= ""+i;
				// Choice
				diffContent[pos].choice 	= "3";
				// Field usage type, defined in data policy
				diffContent[pos].fieldusage = tempInfoCurrent[i].fieldUsage;
				// Field name in dbdict
				diffContent[pos].field 		= tempInfoCurrent[i].field;
				// To keep the index in template
				userXbg.push(i);

				pos++;
				continue;

			}

			// User modified-only fields
			if( valueCurrent != valueSave && valueModified == valueSave ){

				if( tempInfoCurrent[i].field in IGNORE_FIELDS ) {
					userXsave.push(i);
					continue;
				}

				userContent[upos].ucaption = tempInfoCurrent[i].caption;
				userContent[upos].uorigin  = tempInfoSave[i].display;
				userContent[upos].uunsaved = tempInfoCurrent[i].display;
				userContent[upos].utype	   = tempInfoCurrent[i].type;
				userContent[upos].uidx	   = ""+i;
				userContent[upos].uchoice  = "3";
				userContent[upos].ufieldusage = tempInfoCurrent[i].fieldUsage;
				userContent[upos].ufield = tempInfoCurrent[i].field;

				userXsave.push(i);
				upos++;

				continue;

			}

			// background modifeied only.
			if( valueCurrent == valueSave && valueModified != valueSave ){

				bgXsave.push(i);
				continue;

			}


		}
		
		sort(diffContent);
		sort(userContent);

		print("[JS diff: $userXsave ]" + userXsave);
		print("[JS diff: $bgXsave ]" + bgXsave);
		print("[JS diff: $userXbg ]" + userXbg);

		return rc;
	}
	catch(e){
		print(e);
	}	

}

function sort(content){
	for (var i = 0; i < content.length-1; i++){
		for (var j = content.length-1; j > i; j--){
			if (rule(content[j-1].fieldusage, content[j].fieldusage)){
				var temp = content[j-1];
				content[j-1] = content[j];
				content[j] = temp;
			}
		}
	}
}

function rule(former, latter){
	//sort rule: Application(2), Data(3),System(1), Deprecated(4)
	var rules = new Array("2", "3" ,"1", "4");
	var isExchange = true;
	var reference = -1;
	for (var i=0; i < rules.length; i++){
		if (former != null && latter != null){
			if (former==rules[i] || latter==rules[i]){
				if (former==rules[i]) isExchange = false;
				break;
			}
		} else if (latter == null){
			isExchange = false;
			break;
		}
		
	}
	
	return isExchange;
}


function merge( $L_template_current, $L_template_modified, $L_template_save, $L_diff_result, $L_merge_temp, $L_file, $L_file_current, $L_file_save ){

	try{
		
		var tempInfoCurrent  = $L_template_current.templateInfo;
		var tempInfoModified = $L_template_modified.templateInfo;
		var tempInfoSave 	 = $L_template_save.templateInfo;
		var diffContent		 = $L_diff_result.conflicts;
		var userContent      = $L_diff_result.usermodified;

		var tempInfo 		= $L_merge_temp.templateInfo;
		var position		= 0;
	
		var userXbg   = vars.$userXbg;
		var bgXsave   = vars.$bgXsave;
		var userXsave = vars.$userXsave;

		// Resolve the conflicts of which user chooses to merge.
		if( system.functions.lng(system.functions.denull(userXbg)) >0 ){
			for( var i = 0; i<system.functions.lng(system.functions.denull(diffContent)); i++ ){
					
					if(diffContent[i].caption == null || diffContent[i].caption == "") continue;

					var idx = diffContent[i].idx; //get the template index of conflicted field. 

					var field = diffContent[i].field;
					$L_file[field] = applyChoice( $L_file_save[field], $L_file_current[field], $L_file[field], diffContent[i].choice );	
				
					position++;
	
			}
		}
		
		// Apply the merge with user modified only fields.
		for( var j = 0; j<system.functions.lng(system.functions.denull(userContent)); j++ ){

			if(userContent[j].ucaption == null || userContent[j].ucaption == "") continue;

			var idx = userContent[j].uidx;

			var field = userContent[j].field;
			$L_file[field] = applyChoice( $L_file_save[field], $L_file_current[field], $L_file[field], userContent[j].choice );	
			
			position++;

			}

	}
	catch(e){
		print(e);
	}

}

function applyChoice(saveVersion, currentVersion, modifiedVersion, choice){

		switch(choice){

			case "1": return saveVersion;
			case "2": return modifiedVersion;
			case "3": return currentVersion;
			default : return currentVersion;
		}

}

function genQuery(record){

	var query = "";
	var fileName = system.functions.filename(record);
	var datadict = new SCFile("datadict");
	var recordName = system.functions.scmsg(fileName,"tablename");
	var keys = null;

	if( datadict.doSelect("name=\"" + fileName + "\"") == RC_SUCCESS ) keys = datadict.unique_key;
    else {
        print("Error: Can not open Data Policy for file " + fileName);
        return null;
    }

    query = keys[0] + "=\"" + record[keys[0]] + "\"";
    for(var i = 1; i<keys.length(); i++){

    	query = query + " and " + keys[i] + "=\"" + record[keys[i]] + "\"";
    }

    return query;

}