/******************************************************
* Module Name: survey EndPointAdapter
* Function: send upload file to Market Tool, get result to manager.
* Author: Huang, Hao
* Version: 1.00
* Creation Date: Oct, 2011
*******************************************************/

var Class = lib.smis_Prototype.getClass();

var SurveyEPAdapter = Class.create({

    initialize: function(configItem){

        this.configItem = configItem;

        if( configItem ){
        //this.mapping = configItem.mapping;
        this.body = new Array();
        this.cacheTasks = new Array();

        this.log = this.configItem.getLogger();

        this.url = this.configItem.getConfigParameterValue("url");
        this.username = this.configItem.getConfigParameterValue("username");
        this.pass = this.configItem.getConfigParameterValue("password");
        this.table = this.configItem.getConfigParameterValue("dbdict");
        this.sid = this.configItem.getConfigParameterValue("surveyID");
        //this.query = this.configItem.getConfigParameterValue("query");

        }

    },

    getRecords: function(){},

    sendRecords: function(){

        this.log.debug("SurveyDestAdapter","sendRecords");

        //get module specific parameter object
        var moduleParameter = this.configItem.MODULE[this.table];

        var re = {"fail":false, "tasks":null, "response":null, "uploadTime":null};
        //var fieldMapping = this.mapping.fieldMapping;
        //var SMFields = this.confgiItem.SMFields;
        var configItem = this.configItem;
        var cacheTasks = this.cacheTasks;
        // assemble the POST body
        this.log.debug("SurveyDestAdapter","cacheTasks.length: " + cacheTasks.length);

        // walk through record data,  task.destObject structure:  { "data":[fields_value], moduleParameter.closeTimeField: close.time  }
        for(var i = 0; i < cacheTasks.length; i++){

            var line = cacheTasks[i].destObject.data;
            this.body.push( line.join( "|" ) );

        }


        try{

            if( this.url.charAt( this.url.length -1 ) != "/" ) this.url += "/";

            lib.SurveyConnection.setServicePassword(this.pass);
            lib.SurveyConnection.setServiceUserName(this.username);
            lib.SurveyConnection.setServiceURL(this.url);

            var response = lib.SurveyConnection.uploadVariables(this.sid, this.body.join("\n"), this.sid+".txt",this.log);
            this.log.debug( "Survey Response: \n",response );

        }catch(e){

            re.fail = true;
            re.tasks = cacheTasks;
            re.response = e;
            re.uploadTime = new Date();
            return re;
        }

        if(response == "Upload failure.") re.fail=true;
        if(!response) re.fail=true;
        re.tasks = cacheTasks;
        re.response = response;
        re.uploadTime = new Date();
        return re;


    },

    cacheRecords: function(task){

        this.cacheTasks.push(task);

    },

    getFields: function( dbdict ){

        var fields = lib.SurveyConfig.geMandatoryFields();



        if( this.configItem ) return fields[ this.table ];

        /////////////////////////SMIS UI/////////////////////////////////////
        if( vars.$L_configInstance ){

            var paramInfo = vars.$L_configInstance.paramInfo;
            for(var i in paramInfo){

                if( paramInfo[i].paramName == "dbdict" ) return fields[ paramInfo[i].paramValue ];

            }

        }

        ////////////////////////Survey UI/////////////////////////////////////////

        if( dbdict ) return fields[ dbdict ];

        return [];

    }
});


function getClass() {return SurveyEPAdapter;}