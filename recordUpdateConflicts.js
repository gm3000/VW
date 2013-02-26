
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

function diff( $L_diff_template, $L_template_current, $L_template_modified, $L_template_save ){

	var tempInfoCurrent  = $L_template_current.templateInfo;
	var tempInfoModified = $L_template_modified.templateInfo;
	var tempInfoSave 	 = $L_template_save.templateInfo;
	var diffContent		 = $L_diff_template.templateInfo;

	var userXbg   = vars.$userXbg;
	var bgXsave   = vars.$bgXsave;
	var userXsave = vars.$userXsave;
	
	vars.$userCaptions = [];
	vars.$userValues = [];

	var lng = system.functions.lng(system.functions.denull( tempInfoCurrent ));
	//print(lng);

	var pos = 0;

	try{

		for( var i=0; i< lng; i++){
	
			var valueCurrent  = system.functions.str( tempInfoCurrent[i].value );
			var valueModified = system.functions.str( tempInfoModified[i].value );
			var valueSave 	  = system.functions.str( tempInfoSave[i].value);
	
			// need to appear in the conflicts table.
			if( (valueCurrent != valueSave) && (valueModified != valueSave) && (valueCurrent != valueModified) ){

				//$L_template.templateInfo[pos] = tempInfoModified[i];
				// to construct the diffContent, then show it in the conflict fields sub-format
				// Caption
				diffContent[pos].caption 	  = tempInfoCurrent[i].caption;
				// original: the radio button and value
				//diffContent[pos].add	 	= false;
				diffContent[pos].field   = tempInfoSave[i].display;
				// current: the radio button and value
				//diffContent[pos].update  	= false;
				diffContent[pos].value   = tempInfoCurrent[i].display;
				// modified: the radio button and value
				//diffContent[pos]["delete"]  = false;
				diffContent[pos].display = tempInfoModified[i].display;

				// Other information of this field
				// field type
				diffContent[pos].type = tempInfoCurrent[i].type;
				// field index in template
				diffContent[pos].globallist	= ""+i;
				
				// radio button checked default by user
				diffContent[pos].fieldUsage = "3";

				//vars.$originalValueList.push(tempInfoSave[i].display);
				//vars.$currentValueList.push(tempInfoCurrent[i].display);
				userXbg.push(i);// keep the position.

				pos++;
				continue;

			}

			// need to be auto-merged.
			if( valueCurrent != valueSave && valueModified == valueSave ){

				userXsave.push(i);
				vars.$userCaptions.push(tempInfoCurrent[i].caption);
				vars.$userValues.push(valueCurrent);
				continue;

			}

			// already in the modified file.
			if( valueCurrent == valueSave && valueModified != valueSave ){

				bgXsave.push(i);
				continue;

			}


		}


		print("[JS diff: $userXsave ]" + userXsave);
		print("[JS diff: $bgXsave ]" + bgXsave);
		print("[JS diff: $userXbg ]" + userXbg);
	}
	catch(e){
		print(e);
	}	

}


function merge( $L_template_current, $L_template_modified, $L_template_save, $L_diff_temp, $L_merge_temp, $L_file ){

	try{
		
		var tempInfoCurrent  = $L_template_current.templateInfo;
		var tempInfoModified = $L_template_modified.templateInfo;
		var tempInfoSave 	 = $L_template_save.templateInfo;
		var diffContent		 = $L_diff_temp.templateInfo;
		print(diffContent);

		var tempInfo 		= $L_merge_temp.templateInfo;
		var position		= 0;
	
		var userXbg   = vars.$userXbg;
		var bgXsave   = vars.$bgXsave;
		var userXsave = vars.$userXsave;

		// apply the conflicts for which user chooses to merge.
		if( system.functions.lng(system.functions.denull(userXbg)) >0 ){
			for( var i = 0; i<system.functions.lng(system.functions.denull(diffContent)); i++ ){
					
					if(diffContent[i].caption == null || diffContent[position].caption == "") continue;

					var idx = diffContent[i].globallist; //get the template index of conflicted field, transfer string to int. 
					
					switch(diffContent[i].fieldUsage){

						case "1":
							tempInfo[position] = tempInfoSave[idx];
							print("JS merge: switch 1");
							print(idx);
							print(tempInfoSave[idx]);
							break;

						case "2":
							tempInfo[position] = tempInfoModified[idx];
							print("JS merge: switch 2");
							print(idx);
							print(tempInfoCurrent[idx]);
							break;

						case "3":
							tempInfo[position] = tempInfoCurrent[idx];
							print("JS merge: switch 3");
							print(idx);
							print(tempInfoModified[idx]);
							break;

						default:
							tempInfo[position] = tempInfoCurrent[idx];
							break;

					}

					position++;
	
			}
		}
		// auto apply the merge with none conflicts fields.
		for( var j = 0; j<system.functions.lng(system.functions.denull(userXsave)); j++ ){

			var idx = userXsave[j];
			//print("[JS merge: auto: idx]" + idx + userXsave);
			//print("[JS merge: auto: tempInfo position]" + position);
			//print("[JS merge: auto: tempInfoCurrent]" + tempInfoCurrent[idx]);

			tempInfo[position] = tempInfoCurrent[idx];
			position++;

			}
	
		// transfer the vlues of template to $L.file
		//print($L_template);
			
		lib.Template.applyTemplate( $L_file, $L_merge_temp, false );
	}
	catch(e){
		print(e);
	}
}