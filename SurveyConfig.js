/******************************************************
* Module Name: survey common lib
* Function: several useful facilities for survey integrations.
* Author: Huang, Hao
* Version: 1.00
* Creation Date: Oct, 2011
*******************************************************/
const MANDATORY_FIELDS={

            "incidents": [{name:"incident.id", type:"string", desc:"Interaction ID"},
                          {name:"title", type:"string", desc:"Title"},
                          {name:"callback.contact", type:"string", desc:"Contact Name"},
                          {name:"*CONTACT_EMAIL", type:"string", desc:"Contact Email"},
                          {name:"owner.name", type:"string", desc:"Service Desk Agent name"},
                          {name:"close.time", type:"date", desc:"Ticket closure time"},
                          {name:"*BACK_WEBURL", type:"string", desc:"URL back to the interaction"},
                          {name:"*BACK_ESSURL", type:"string", desc:"ESS URL back to the interaction"},
                          {name:"*CONTACT_LOCALE", type:"string", desc:"Locale of Contact"},
                          ],

            "probsummary": []

        };

function geMandatoryFields(){return MANDATORY_FIELDS;}

// pass me the contact or operator name, I return its email and language to you.

function get_Email_Lan( user ){

    var username = user;
    var re = {"email":null, "lan":null};

    var operator = new SCFile( "operator" );
    var contact = new SCFile( "contacts" );

    var sql_op = "name=\"" + username +"\"";
    var sql_co = "contact.name=\"" + username + "\"";

    if( contact.doSelect( sql_co ) == RC_SUCCESS ){

            re.email = contact.email;
            if( !contact.language ){

                operator.doSelect( "name=\"" + contact.operator_id + "\"" );
                re.lan = (operator.syslanguage)?getLanguageName(operator.syslanguage):getLanguageName("en");

            }
            else re.lan = getLanguageName(contact.language);

    }
    else{

        if( operator.doSelect( sql_op ) == RC_SUCCESS ){

            re.email = operator.email;
            contact.doSelect(  "contact.name=\"" + operator.contact_name + "\"" );
            if( !contact.language ) re.lan = (operator.syslanguage)?getLanguageName(operator.syslanguage):getLanguageName("en");
            else re.lan = getLanguageName(contact.language);

        }

    }

    return re;

}



function getLanguageName( languageID ){

    var id = languageID;
    var language = new SCFile("language");

    if( language.doSelect("unique.id=\"" + id + "\"") == RC_SUCCESS ) return language.language;
    else return "English";


}

// generate back link rul for this record: interaction/incident/change, etc.

function genURL( record, logger ){

    var url = {"web":"", "ess":""};

    var record_query = "";
    var record_title = "";
    var record_id = "";
    var datadict = new SCFile("datadict");
    var file_name = system.functions.filename(record);
    var record_name = system.functions.scmsg(file_name,"tablename");
    var keys = null;

    if( datadict.doSelect("name=\"" + file_name + "\"") == RC_SUCCESS ) keys = datadict.unique_key;
    else {
        logger.error("suveyLib","Error: Can not open Data Policy for file " + file_name);
        return null;
    }

    // get record query and record title

    record_id = record[keys[0]];
    record_query = keys[0] + "=\"" + record[keys[0]] + "\"";

    for(var i=1; i<keys.length(); i++){

        record_id = record_id + ";" + record[keys[i]];
        record_query = record_query + " and " + keys[i] + "=\"" + record[keys[i]] + "\"";

    }


    record_title = record_name+" "+record_id;

    url.web = lib.urlCreator.getURLFromQuery(file_name,record_query,record_title);
    url.ess = lib.urlCreator.getESSURLFromQuery(file_name,record_query,record_title);

    return url;
}


// re-use read tasks from smis_taskmanager, add records count limitation <5000
function readTasks(intId) {
	var logger = lib.smis_ConfigurationManager.singletonInstance().getLogger();

	logger.debug("SurveyConfig", "readTasks");

	var findTask = new SCFile ( "SMISTaskQueue" );
	var f = findTask.doSelect( "expired <> true and intId = \"" + intId + "\"" );

	//set sort by id, enqueueTimestamp asc
	system.functions.setsort(findTask, new Array("enqueueTime"), 0);

	var failId;

	//if( !is921() ){

	if(f == RC_SUCCESS) {
	   f = findTask.getFirst();
	} else
		logger.debug("SurveyConfig.readTasks", "No records found.");
	//}

	var list = [];
	var commLib = lib.smis_CommonLib;
        var count = 0;
	while ( f == RC_SUCCESS && count <= 5000 )
	{
		var task = new (lib.smis_Task.getClass())(intId);
		//task.id = findTask.
		var data = commLib.getStringFromArray(findTask.data);
		//task.inRecord = eval("(" + data + ")");
		//logger.info("smis_TaskManager", "task.data: "+data);
		task.inRecord = commLib.fromJSON(data);
		task.id = findTask.id;
		task.direction = findTask.direction;
		task.retry = findTask.retry;
		task.expired = findTask.expired;
		task.enqueueTime = findTask.enqueueTime;
		task.integrationName = findTask.integrationName;
		list.push(task);
                count++;

		f = findTask.getNext();


	}

	return list;
}


function isSupportType( type ){

    return type==1 || type==2 || type==3 || type==4;

}

//get all the suppoted fields and corresponding captions from specific table, sort it by Caption
// param tableName - String
// param mandatory - Object {"[field_name]",null}
function getSupportedFields( tableName, mandatory ){

    var mandatoryFields   = mandatory || {};
    var fieldsInfo        = new Array();
    var captionArray      = new Array();
    var fieldHash         = new Object();

    var table  = new SCFile( tableName );
    var dbdict = new SCFile( "dbdict" );
    if( dbdict.doSelect( "name=\""+ tableName + "\"" ) == RC_SUCCESS ){

        var fields = dbdict.field;
        var length = dbdict.field.length();
        for(var i=0; i<length; i++){

            if( fields[i].level == 1 && isSupportType( fields[i].type ) ){

               if( fields[i].name in mandatoryFields ) continue;

               var _caption = system.functions.policyread( table, fields[i].name, "captions" ) || fields[i].name;
               fieldHash[ _caption ] = fields[i].name;
               captionArray.push( _caption );

            }

        }

        // sort captions and corresponding fields name, construct retrun object
        captionArray.sort();
        for( var i=0; i< captionArray.length; i++){

            var x = {
                        "fieldName":fieldHash[ captionArray[i] ],
                        "fieldCaption":captionArray[i]
                    }
            fieldsInfo.push(x);

        }

    }

    return fieldsInfo;

}

function denullarray(array, lng){

    var length=lng||array.length;
    var re = new SCDatum();
    re.setType(8);

    for(var i=0; i<length; i++){

        if( array[i] ) re.push(array[i]);

    }

    return re;

}


// function: add a new SMISConfiguration instance
// return  : surveyinstance id
function add_edit_SurveySchedule(file, /* type:SCDatum */smFields, mode){

    var config = new Object();

    // initialize config parameters
    config.url        = file["survey.url"];
    config.username   = file["survey.username"];
    config.password   = file["survey.password"];
    config.surveyID   = file["survey.id"];
    config.surveyName = file["survey.name"];
    config.interval   = file["survey.interval"];
    config.module     = file["survey.sm.module"];
    config.log        = file["survey.sm.log"];
    config.query      = file["sm.query"];
    config.fields     = smFields;

    // add it
    try{

        if(mode=="add"){

            var intId = createSMISInstance("SurveySchedule");
            var sig = configureSurveyInstance( intId, config );
            return new Array(intId,sig);
        }

        if(mode=="save"){

            var configItem = lib.smis_ConfigurationManager.getInstanceConfig( file["instance.id"] );
            if( configItem.status == lib.smis_Constants.INSTANCE_STATUS_RUNNING() || configItem.status == lib.smis_Constants.INSTANCE_STATUS_SLEEPING() ) return "Alive";

            var sig = configureSurveyInstance( file["instance.id"], config );
            return new Array(configItem.intId, sig);
        }

    }catch(e){

        print("Error: "+e);

    }

    return false;

}

function validate( file ){

    var mandatory={

                "survey.url":"MarketTools URL",
                "survey.username":"User Name",
                "survey.password":"Password",
                "survey.id":"Survey ID",
                "survey.interval":"Interval",
                "survey.sm.module":"Module",
                "sm.query":"Data Filter",
                "last.close.time":"Close time after"

                }
    var re = ["pass"];

    for( var i in mandatory ){

        if( !file[i] ) {
            re = ["fail",mandatory[i]];
            return re;
        }

    }

    // amount of optional fields should <=15
    var lng = system.functions.lng( file["optional.fields"] );
    if( lng > 15 ){

        re = ["maxoptional",""+lng];
        return re;
    }

    return re;
}


function surveyRunNow( intId ){

    var config = lib.smis_ConfigurationManager.getInstanceConfig(intId);
    var bootstrap = new (lib.smis_Bootstrap.getClass())(config);
    var result = bootstrap.runnow();
	print("A survey with latest data has been sent.");

}


function genQuery( configItem ){

    var intId = configItem.intId;
    var sql = configItem.getConfigParameterValue("query");
    var table = configItem.getConfigParameterValue("dbdict");
    var surveyId = configItem.getConfigParameterValue("surveyID");
    var closeTimeField = configItem.MODULE[table].closeTimeField;
    var log = configItem.getLogger();

    var taskqueue     = new SCFile( "SMISTaskQueue");
    var surveyinstance = new SCFile( "surveyinstance" );
    var T_RC = taskqueue.doSelect( "intId=\"" + intId + "\"" );
    var S_RC = surveyinstance.doSelect( "instance.id=\"" + intId + "\"");

    // if taskqueue still has tasks waiting, skip query this time
    if( T_RC != RC_SUCCESS && S_RC == RC_SUCCESS ) return sql + " and " + closeTimeField + ">\'" + system.functions.str( surveyinstance["last.close.time"] ) + "\'";

    if( T_RC == RC_SUCCESS ) log.info( "SurveyConfig","genQuery() - taks queue is not empty, skip this query." );
    if( S_RC != RC_SUCCESS ) log.error("SurveyConfig","genQuery() - surveyinstance not existed, can not generate sql.");

    return false;

}

/**
	Create an instance of SMISConfiguration by template name.

	@param templateName, template name, for example SMtoRC

	@return configuration instance ID.

	@author Li,Lei
	@ModifiedBy Liu,Yong-Liang, on 2011/10/25
*/
function createSMISInstance(templateName) {
    var registry = new SCFile("SMISRegistry");
    var ret = registry.doSelect("name=\"" + templateName + "\"");
    if (ret == RC_SUCCESS) {
        var configInstance = new SCFile("SMISConfiguration");
        configInstance.name = registry.name;
        configInstance.version = registry.version;
        configInstance.ctrlName = registry.ctrlName;
        configInstance.category = registry.category;
        configInstance.mgrName = registry.mgrName;
        configInstance.SMAdapter = registry.SMAdapter;
        configInstance.EPAdapter = registry.EPAdapter;
        configInstance.supportRT = registry.supportRT;
        configInstance.description = registry.description;
        configInstance.template = registry.name;
        configInstance.status = lib.smis_Constants.INSTANCE_STATUS_DISABLE();
        configInstance.loggerLevel = "WARNING";

        //paramters
        for (var i in registry.paramInfo) {
            configInstance.paramInfo[i].paramName = registry.paramInfo[i].paramName;
            configInstance.paramInfo[i].paramValue = registry.paramInfo[i].paramValue;
            configInstance.paramInfo[i].ispwd = registry.paramInfo[i].ispwd;
            configInstance.paramInfo[i].paramDesc = registry.paramInfo[i].paramDesc;
            configInstance.paramInfo[i].paramCategory = registry.paramInfo[i].paramCategory;
        }

		lib.smis_ConfigurationManager.initParams(configInstance);

        //fields
        try {
        	vars.$L_configInstance=configInstance;
            var smAdapter = eval("new (lib."+registry.SMAdapter+".getClass())(null)");
            var smFields = smAdapter.getFields();

            var epAdapter = eval("new (lib."+registry.EPAdapter+".getClass())(null)");
            var epFields = epAdapter.getFields();


            var tempSMFields = new SCDatum();
            tempSMFields.setType(8);

            var tempEPFields = new SCDatum();
            tempEPFields.setType(8);


            for(var i in smFields) {
                      configInstance.SMFields[i].SMFieldName = smFields[i].name;
                      configInstance.SMFields[i].SMFieldType = smFields[i].type;
                      configInstance.SMFields[i].SMFieldDesc = smFields[i].desc;
                }


                for(var i in epFields) {
                      configInstance.EPFields[i].EPFieldName = epFields[i].name;
                      configInstance.EPFields[i].EPFieldType = epFields[i].type;
                      configInstance.EPFields[i].EPFieldDesc = epFields[i].desc;
                }
          } catch (e) {
                print(e);
          }

            configInstance.intId = "" + getnumber("SMISConfiguration");

          //save config instance
          configInstance.doAction("addsave");


          if ((registry.fieldMapping!=null && registry.fieldMapping.length()>0)  ||
              (registry.valueMapping!=null && registry.valueMapping.length()>0)) {
            var fieldMapping = new SCFile("SMISFieldMapping");
            //field mapping
            for (var i in registry.fieldMapping) {
                fieldMapping.fieldMapping[i].SMField = registry.fieldMapping[i].SMField;
                fieldMapping.fieldMapping[i].EPField = registry.fieldMapping[i].EPField;
                fieldMapping.fieldMapping[i].SMDefValue = registry.fieldMapping[i].SMDefValue;
                fieldMapping.fieldMapping[i].EPDefValue = registry.fieldMapping[i].EPDefValue;
                fieldMapping.fieldMapping[i].SMjscallback = registry.fieldMapping[i].SMjscallback;
                fieldMapping.fieldMapping[i].EPjscallback = registry.fieldMapping[i].EPjscallback;
                fieldMapping.fieldMapping[i].direction = registry.fieldMapping[i].direction;
                fieldMapping.fieldMapping[i].FMDescription = registry.fieldMapping[i].FMDescription;
                fieldMapping.fieldMapping[i].valueMappingGroup = registry.fieldMapping[i].valueMappingGroup;
         }

           for (var j in registry.valueMapping) {
                fieldMapping.valueMapping[j].SMValue = registry.valueMapping[j].SMValue;
                fieldMapping.valueMapping[j].EPValue = registry.valueMapping[j].EPValue;
                fieldMapping.valueMapping[j].valueMappingGroupID = registry.valueMapping[j].valueMappingGroupID;
                fieldMapping.valueMapping[j].VMDescription = registry.valueMapping[j].VMDescription;
           }
         //save fieldmapping
           fieldMapping.intId = configInstance.intId;
           fieldMapping.doAction("addsave");
           }

          return configInstance.intId;
     }
}

/**
	get instance number. (the next number to be used)

	@param filename, name of a SM table

	@return configuration instance ID.

	@author Li,Lei
	@ModifiedBy Liu,Yong-Liang, on 2011/10/25
*/
function getnumber(filename) {

    lib.smis_ConfigurationManager.checkNumberFile("SMISConfiguration");
    lib.smis_ConfigurationManager.checkNumberFile("SMISTaskQueue");

    var callRtn = new SCDatum;
    var nextNumber = new SCDatum;
    system.functions.rtecall("getnumber", callRtn, nextNumber, filename);
    var id = nextNumber.getText();
    return id;

}

/**
	Confiture an survey instance..

	@param instanceId, ID of the survey instance;
	@param param, parameter values to set for the survey instance.

	@return configuration instance ID.

	@author Liu,Yong-Liang
*/
function configureSurveyInstance(instanceId,param) {

    var configInstance = new SCFile("SMISConfiguration");
    var ret = configInstance.doSelect("intId=\"" + instanceId + "\"" );
    if (ret != RC_SUCCESS) {
        return null;
    }
    //reset the instance name
    configInstance.name = configInstance.template+"_"+ instanceId +"_"+param.surveyID+"_";
    configInstance.logFileDir=param.log || "..\\logs";

    //set default trigger parameters
    configInstance.intervalTime=param["interval"];
    configInstance.maxRetryTime=999;

    //paramters
    for (var i in configInstance.paramInfo) {
        if(configInstance.paramInfo[i].paramName=="url"){
            configInstance.paramInfo[i].paramValue = param["url"];
        }else if(configInstance.paramInfo[i].paramName=="username"){
            configInstance.paramInfo[i].paramValue = param["username"];
            configInstance.paramInfo[i].ispwd = true;
        }else if(configInstance.paramInfo[i].paramName=="password"){
            configInstance.paramInfo[i].paramValue = param["password"];
            configInstance.paramInfo[i].ispwd = true;
        }else if(configInstance.paramInfo[i].paramName=="query"){
            configInstance.paramInfo[i].paramValue = param["query"];
        }else if(configInstance.paramInfo[i].paramName=="surveyID"){
            configInstance.paramInfo[i].paramValue = param["surveyID"];
        }else if(configInstance.paramInfo[i].paramName=="dbdict"){
            configInstance.paramInfo[i].paramValue = param["module"];
        }
    }

    //reset fields, need all the fields to be in the right order
    var temp_configure = new SCFile("SMISConfiguration");
    configInstance.SMFields = temp_configure.SMFields;
    configInstance.EPFields = temp_configure.EPFields;

    var lng = param.fields.length();
    for( var j=0; j<lng; j++ ){

        configInstance.SMFields[j].SMFieldName = param.fields[j];
        configInstance.SMFields[j].SMFieldType = "string";
        configInstance.SMFields[j].SMFieldDesc = "";

        configInstance.EPFields[j].EPFieldName = param.fields[j];
        configInstance.EPFields[j].EPFieldType = "string";
        configInstance.EPFields[j].EPFieldDesc = "";
    }

    //save config instance
    configInstance.doAction("save");

    //create a record for info and setup the scheduler
    lib.smis_ConfigurationManager.setupScheduler(instanceId,configInstance.name);

    //get signature of this SMISConfiguration record
    var sig = makeSigForSMISConfiguration(configInstance)

    return sig;
}

/**
	make signature for a record.

	@param scFile, an instance of SCFile;
	@param exclusionFields,
	@return the signature of the record.

	@author Liu,Yong-Liang
*/
function makeSig(scFile,exclusionFields) {
	var result = system.functions.make_sig(scFile,exclusionFields,0);
	return result;
}

function makeSigForSMISConfiguration(scFile) {
	return makeSig(scFile,["status","maxRetryTime"],0);;
}

/**
	synchronize from SMIS to survey instance.
	this function should be invoked each time performs a search of survey instance.

	@author Liu,Yong-Liang
*/
function syncFromSMISToSurvey() {
	var config = new SCFile("SMISConfiguration");
	var surveyinstance = new SCFile("surveyinstance");
    var RC = surveyinstance.doSelect(true);
	var RC2;

    while ( RC == RC_SUCCESS ){
      RC2 = config.doSelect("intId=\""+surveyinstance.instance_id+"\""+" and template=\"SurveySchedule\"");
      if ( RC2 == RC_SUCCESS ){
	  	var sig = makeSigForSMISConfiguration(config);
	  	if(surveyinstance.instance_sig!=sig){
	  		surveyinstance.instance_sig=sig;
	  		updateValueFromSMIS(config,surveyinstance);
	  		print("Record synchronized from SMIS to survey integration instance (updated: instance.id="+surveyinstance.instance_id+")");
	  	}
      }else{
      	surveyCascadeDelete(surveyinstance);
      	print("Record synchronized from SMIS to survey integration instance (removed: instance.id="+surveyinstance.instance_id+")");
      }
      RC = surveyinstance.getNext();
    }
}
/**
	cascade delete record of both surveyinstance and surveyuploadhistory table.
	@param surveyinstance survey instance records.

	@author Liu,Yong-Liang
*/
function surveyCascadeDelete(surveyinstance){
	var history = new SCFile("surveyuploadhistory");
    var RC = history.doSelect("instance.id=\"" + surveyinstance.instance_id + "\"" );
    var result=true;
    while ( RC == RC_SUCCESS ){
      if(history.doDelete()!= RC_SUCCESS){
      	result=false;
	  }

	  RC = history.getNext();
    }
    if(result==true){
    	surveyinstance.doDelete();
    }
}

/**
	cascade delete record of both surveyinstance and surveyuploadhistory table.
	@param surveyinstance survey instance records.

	@author Huang,Hao
	@Modifiedby Liu,Yong-Liang
*/
function updateValueFromSMIS(config,surveyInstance){

    //get mandatory fields list
    var prdefinedFields = MANDATORY_FIELDS[surveyInstance["survey.sm.module"]];
    var mandatoryFields = new Array();
    for(var i=0; i<prdefinedFields.length; i++) mandatoryFields.push(prdefinedFields[i].name);

    // SMIS - substract mandatory fields and optional Fields
    var SMFields = new Array();
    for(var i=0; i<config.SMFields.length(); i++){

         SMFields.push( config.SMFields[i].SMFieldName );
    }

    var SMIS_mandatory = SMFields.splice( 0, mandatoryFields.length );
    var SMIS_optional  = SMFields;

    // assemble surveyinstance file
    for(var i = 0; i < config.paramInfo.length(); i++) {
		if(config.paramInfo[i].paramName == "url") {
			surveyInstance["survey.url"] = config.paramInfo[i].paramValue;
		}else if(config.paramInfo[i].paramName == "username") {
			surveyInstance["survey.username"] = config.paramInfo[i].paramValue;
		}else if(config.paramInfo[i].paramName == "password") {
			surveyInstance["survey.password"] = config.paramInfo[i].paramValue;
		}else if(config.paramInfo[i].paramName == "surveyID") {
			surveyInstance["survey.id"] = config.paramInfo[i].paramValue;
		}else if(config.paramInfo[i].paramName == "dbdict") {
			surveyInstance["survey.sm.module"] = config.paramInfo[i].paramValue;
		}else if(config.paramInfo[i].paramName == "query") {
			surveyInstance["sm.query"] = config.paramInfo[i].paramValue;
		}
	}
    surveyInstance["survey.interval"]  = config.intervalTime;
    surveyInstance["survey.sm.log"]    = config.logFileDir;

    for( var i=0; i<SMIS_optional.length; i++ ){

        surveyInstance.optional_fields[i] = SMIS_optional[i];

    }
	surveyInstance.doUpdate();

}

/**
	Assemble query string for survey upload history.
	@param instanceId, survey instance id.
	@param histInterval, upload history time span
	@param uploadStatus, upload status, OK or Failure

	@author Liu,Yong-Liang
*/
function getUploadHistoryQueryString(instanceId,histInterval,uploadStatus){
	var querystring="instance.id="+instanceId;

	if(histInterval=="older than 1 Year"){
		querystring+=" and upload.time < tod()-'365 00:00:00'";
	}else if(histInterval=="for the Last 1 Year"){
		querystring+=" and upload.time >= tod()-'365 00:00:00'";
	}else if(histInterval=="for the Last 6 Months"){
		querystring+=" and upload.time >= tod()-'183 00:00:00'";
	}else if(histInterval=="for the Last 3 Months"){
		querystring+=" and upload.time >= tod()-'92 00:00:00'";
	}else if(histInterval=="for the Last 1 Month"){
		querystring+=" and upload.time >= tod()-'30 00:00:00'";
	}else if(histInterval=="for the Last 1 Week"){
		querystring+=" and upload.time >= tod()-'7 00:00:00'";
	}else if(histInterval=="for the Last 1 Day"){
		querystring+=" and upload.time >= tod()-'1 00:00:00'";
	}else{

	}
	if(uploadStatus!=null && uploadStatus!="" && uploadStatus!="null"){
		querystring+=" and upload.status=\""+uploadStatus+"\"";
	}
	return querystring;
}

/**
	Remove survey upload history.
	@param querystring, query string to query records to remove.

	@author Liu,Yong-Liang
*/
function removeUploadHistories(querystring){
	var scFile=new SCFile("surveyuploadhistory");
	var rc=scFile.doSelect(querystring);
	while(rc== RC_SUCCESS){
		scFile.doDelete();

	 	rc=scFile.getNext();
	}
}


/**
	Rerefresh instance by ID.
	@param instanceId, survey instance id.

	@author Liu,Yong-Liang
*/
function refreshInstancesById(instanceId){

	var instanceConfig = lib.smis_ConfigurationManager._getInstanceConfigByIntId(instanceId);
	if ( instanceConfig != null ){

		//Reset the status
		var procId = lib.smis_SchedulerManager.getProcID(instanceConfig);

		if (procId == null && instanceConfig.status != lib.smis_Constants.INSTANCE_STATUS_DISABLE()) {

			lib.smis_ConfigurationManager.setInstanceStatus(instanceConfig.intId,lib.smis_Constants.INSTANCE_STATUS_DISABLE());
			instanceConfig.status = lib.smis_Constants.INSTANCE_STATUS_DISABLE();
		}

		eval("var flag = vars.$G_system_info." + instanceConfig.template );
		if (instanceConfig.status != lib.smis_Constants.INSTANCE_STATUS_DISABLE()) {
		    if (!flag) {
			   lib.smis_ConfigurationManager._updateFlag(instanceConfig.template, true);
			   lib.smis_ConfigurationManager._initGlobalVariables(instanceConfig.getParametersByCategory(lib.smis_Constants.GLOBAL_CATEGORY()));
			}
		} else {
		   if (flag) {
		       lib.smis_ConfigurationManager._updateFlag(instanceConfig.template, false);
		   }

		}
		return instanceConfig.status;
	}
}

/**
	generate paged history list.

	@author Liu,Yong-Liang
*/
function generatePaginatedHistoryList(){
	vars.$upload_time_copy=new SCDatum([]);
	vars.$last_ticket_close_time_copy=new SCDatum([]);
	vars.$upload_status_copy=new SCDatum([]);
	vars.$record_count_copy=new SCDatum([]);
	vars.$upload_response_copy=new SCDatum([]);

	lib.pagination.paginate("$L'pagination.stepward", "$L.pagination.curPage", "$L.pagination.itemsPerPage", "$L.pagination.totalPages", "$upload.time", "$last.ticket.close.time", "$upload.status", "$record.count", "$upload.response");

	vars.$L_pagination_curPageStr=" of "+vars.$L_pagination_totalPages;
	vars.$L_pagination_prev_enabled=(vars.$L_pagination_curPage>1);
	vars.$L_pagination_next_enabled=(vars.$L_pagination_curPage<vars.$L_pagination_totalPages);
}

function doAction(intId, action){

    //var config = lib.smis_ConfigurationManager.getInstanceConfig( intId );

    if(action == "enable" || action == "Enable") lib.smis_ConfigurationManager.enableInstance( intId );
    if(action == "disable" || action == "Disable") lib.smis_ConfigurationManager.disableInstance( intId );

    // stamp hisoty; construct description - desc
    var expiration = getScheduleField(intId,"expiration");
    var desc = "Will "+action+" after "+system.functions.str( system.functions.nullsub(expiration,"now") );
    print(desc);
    stampActionHistory(intId, action, desc);

}

function convertDatetoString( date ){

    if ( date == null )
        return null;
    var  strMonth = system.functions.str( system.functions.month(date) );
    var  strDay   = system.functions.str( system.functions.day(date) );
    var  strYear  = system.functions.str( system.functions.year( date) );
    var  strTime  = system.functions.str( system.functions.time( date ) );
    var  strDate;

    if (system.functions.lng(strMonth) == 1) strMonth = "0" + strMonth;

    if (system.functions.lng(strDay) == 1) strDay = "0" + strDay;

    strDate = strMonth + "/" + strDay + "/" + strYear +" " + strTime;

    return strDate;

}

function stampActionHistory(intId, action, desc){

    var history = new SCFile("surveyuploadhistory");

    history["instance.id"]         = intId;
    history["upload.time"]         = new Date();
    history["upload.response.msg"] = desc;


    if( action=="Disable" || action=="disable" ){

        history["upload.status"] = "Disable";
    }

    if( action=="Enable" || action=="enable" ){

        history["upload.status"] = "Enable";
    }

    var RC = history.doInsert();
    if( RC != RC_SUCCESS ) print( "Error: stampActionHistory - "+RCtoString(RC) );

}

function getScheduleField(intId, getField, className){

    var config = lib.smis_ConfigurationManager._getInstanceConfigByIntId( intId );
    className = lib.smis_SchedulerManager._getSchClassName(config.name + config.intId);

    //query schedule
    var schedule = new SCFile("schedule");
    var RC = schedule.doSelect("class=\""+className+"\"");
    if(RC==RC_SUCCESS){

        return schedule[getField];
    }
    else return null;

}

function is921(){

    var sv = new SCFile("scversion");
    if(sv.doSelect("true") == RC_SUCCESS){

        var version = sv.application_version;
        if( version.indexOf("9.21") != -1 ) return true;

    }
    return false;

}