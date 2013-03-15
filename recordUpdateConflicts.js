
//Usage in RAD: $L.void=jscall("recordUpdateConflicts.diff", $L.diff.temp, $L.template.current, $L.template.modified, $L.template.save)
/**
     * templateInfo			fields used in $L_diff_temp:
     * caption 		: 4		Caption    : field caption
     * display 		: 6		field 	   : original value
     * field 		: 1		value 	   : current value
     * fieldUsage 	: 7		display    : modified value
     * globallist 	: 5		type 	   : field type
     * type 		: 2		globallist : field index in each template
     * value 		: 3		fieldUsage : radio button
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
	//print(lng);

	var pos = 0;
	var upos = 0;

	try{

		for( var i=0; i< lng; i++){
	
			var valueCurrent  = system.functions.str( tempInfoCurrent[i].value );
			var valueModified = system.functions.str( tempInfoModified[i].value );
			var valueSave 	  = system.functions.str( tempInfoSave[i].value);
	
			// conflicts: need to appear in the conflicts table.
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
				//$L_template.templateInfo[pos] = tempInfoModified[i];
				// to construct the diffContent, then show it in the conflict fields sub-format
				// Caption
				diffContent[pos].caption 	  = tempInfoCurrent[i].caption;
				// original: the radio button and value
				//diffContent[pos].add	 	= false;
				diffContent[pos].origin   = tempInfoSave[i].display;
				// current: the radio button and value
				//diffContent[pos].update  	= false;
				diffContent[pos].unsaved   = tempInfoCurrent[i].display;
				// modified: the radio button and value
				//diffContent[pos]["delete"]  = false;
				diffContent[pos].dbvalue = tempInfoModified[i].display;

				// Other information of this field
				// field type
				diffContent[pos].type = tempInfoCurrent[i].type;
				// field index in template
				diffContent[pos].idx	= ""+i;
				
				// radio button checked default by user
				diffContent[pos].choice = "3";
				
				// sort by usage type
				diffContent[pos].fieldusage = tempInfoCurrent[i].fieldUsage;

				userXbg.push(i);// keep the position.

				pos++;
				continue;

			}

			// user modified only: need to be appeared in the "user modified only" section and auto-merged.
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

		// date time field is not supported by Template script, we need cache it and apply the choice separately.
		var dateTimeField = {};

		// apply the conflicts for which user chooses to merge.
		if( system.functions.lng(system.functions.denull(userXbg)) >0 ){
			for( var i = 0; i<system.functions.lng(system.functions.denull(diffContent)); i++ ){
					
					if(diffContent[i].caption == null || diffContent[i].caption == "") continue;

					var idx = diffContent[i].idx; //get the template index of conflicted field. 

					// date time field is not supported by Template script, we need cache it and apply the choice separately.
					if(diffContent[i].type == "3"){
						dateTimeField[tempInfoSave[idx].field] = diffContent[i].choice;
						continue;
					}

					tempInfo[position] = applyChoice(tempInfoSave[idx], tempInfoCurrent[idx], tempInfoModified[idx], diffContent[i].choice);
				
					position++;
	
			}
		}
		
		// apply the merge with user modified only fields.
		for( var j = 0; j<system.functions.lng(system.functions.denull(userContent)); j++ ){

			if(userContent[j].ucaption == null || userContent[j].ucaption == "") continue;

			var idx = userContent[j].uidx;

			// date time field is not supported by Template script, we need cache it and apply the choice separately.
			if(userContent[j].utype == "3"){
				dateTimeField[tempInfoSave[idx].field] = userContent[j].uchoice;
				continue;
			}

			tempInfo[position] = applyChoice(tempInfoSave[idx], tempInfoCurrent[idx], tempInfoModified[idx], userContent[j].uchoice);
			
			position++;

			}
			
	
		// transfer the vlues of template to $L.file
		//print($L_merge_temp);
			
		lib.Template.applyTemplate( $L_file, $L_merge_temp, false );

		// apply datetime field choice.
		for(var field in dateTimeField){

			$L_file[field] = applyChoice( $L_file_save[field], $L_file_current[field], $L_file[field], dateTimeField[field] );	
			
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