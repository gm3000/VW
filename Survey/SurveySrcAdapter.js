/******************************************************
* Module Name: survey SMAdapter
* Function: query records from SM, transform them as Objects, and return back to manager
* Author: Huang, Hao
* Version: 1.00
* Creation Date: Oct, 2011
*******************************************************/

var Class = lib.smis_Prototype.getClass();

var SurveySMAdapter = Class.create({

    initialize: function(configItem){

        this.configItem = configItem;

        if( configItem ){
        this.log = this.configItem.getLogger();
        //this.mapping = configItem.mapping;
        this.commLib = lib.smis_CommonLib;

        this.table = this.configItem.getConfigParameterValue("dbdict");
        this.query = this.configItem.getConfigParameterValue("query");
        }

    },

    getRecords: function(){

        this.log.debug("SurveySrcAdapter","getRecords");

        //get module specific parameter object
        var moduleParameter = this.configItem.MODULE[this.table];

        //var fm = this.mapping.fieldMapping;
        //var SMFields = this.confgiItem.SMFields;
        var configItem = this.configItem;
        var records = new Array();
        var userInfo = null;

        var query = lib.SurveyConfig.genQuery( this.configItem );

        if( query ){

            var db = new SCFile(this.table);
            var RC = db.doSelect( query );
            system.functions.setsort(db, moduleParameter.sortField, 0);

            // used fro data limit of query if there is a limitation
            var count=0;
            var exceed=false;

            if( RC == RC_SUCCESS ){
                do{
                    var temp_record = new Object();
                    var task_data = new Object();  // task data structure  { "data":[fields_value], moduleParameter.closeTimeField: close.time  }
                    var dest_record = new Array();

                    //get callback url for this record
                    var url = lib.SurveyConfig.genURL( db, this.log );

                    //get userInfo
                    userInfo = lib.SurveyConfig.get_Email_Lan( db[moduleParameter.contactField] );

                    // *** potential performance risk

                    temp_record["*BACK_WEBURL"] = url.web;
                    temp_record["*BACK_ESSURL"] = url.ess;

                    //set User info
                    temp_record["*CONTACT_EMAIL"] = userInfo.email;
                    temp_record["*CONTACT_LOCALE"] = userInfo.lan;

                    //construct object for each record
                    for(var i=0; i<configItem.SMFields.length(); i++){

                        var SMFieldName = configItem.SMFields[i].SMFieldName;

                        // get field value and convert it
                        if( SMFieldName.indexOf("*") == 0 ) {
                            dest_record.push( temp_record[SMFieldName] );
                            continue;
                        }

                        if (!this.commLib.isEmpty(SMFieldName)) {

                            var temp_value = db[SMFieldName];

                            // format time string to US type
                            if(system.functions.type(temp_value) == 3) temp_value = lib.SurveyConfig.convertDatetoString(temp_value);
                            var value = "" + temp_value;
                            dest_record.push(value);
                        }

                    }

                    task_data.data = dest_record;

                    // to ensure it saved "last clos time" field of this module
                    task_data[moduleParameter.closeTimeField] = system.functions.str(db[moduleParameter.closeTimeField]);

                    records.push( task_data );

                    // placeholder for record count limitation
                    count++;
                    if( this.configItem.RECORD_LIMIT ) exceed = ( count > this.configItem.RECORD_LIMIT )? true : false;

                }while( db.getNext() == RC_SUCCESS && !exceed )

            }
            else this.log.info( "SurveySrcAdapter","getRecords() " + RCtoString( RC ) );

        }

        return records;

    },

    sendRecords: function(){


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


function getClass() {return SurveySMAdapter;}