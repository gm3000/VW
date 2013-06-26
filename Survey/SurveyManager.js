/******************************************************
* Module Name: survey Controller
* Function: provide default data process management
* Author: Huang, Hao
* Version: 1.00
* Creation Date: Oct, 2011
*******************************************************/

var Class = lib.smis_Prototype.getClass();

var SurveyManagerClass = Class.create({

    initialize: function(configItem) {

        this.configItem = configItem;
        this.log = this.configItem.getLogger();
        this.intId = this.configItem.intId;
        this.result = new Object();

        // initialize history file
        //this.history = new (lib.SurveyUpHis.getClass())(this.configItem);
        if(configItem.history){
            this.history = configItem.history;
            this.history.instance_id = this.intId;
        }


        var adapter1Name = this.configItem.SMAdapter;
        eval("this.SMAdapter = new (lib." + adapter1Name + ".getClass())(this.configItem);");
        var adapter2Name = this.configItem.EPAdapter;
        eval("this.EPAdapter = new (lib." + adapter2Name + ".getClass())(this.configItem);");


    },

    //append records to task queue
    appendTasks: function(){
        this.log.debug("SurveyManager","appendTasks");
        var records = this.SMAdapter.getRecords();
        for (var start = 0; start < records.length; start++) {

            var task = new (lib.smis_Task.getClass())(this.intId);
            task.inRecord = records[start];
            task.id = "endpoint1-"+task.inRecord.id;
            task.integrationName = this.configItem.name;
            task.direction = lib.smis_Constants.MAPPING_DIRECTION_LEFTRIGHT();
            lib.smis_TaskManager.pushTask(task);
            if(start == records.length - 1) this.stampLastClosedTime(task);// stamp last close time value for this query
        }

    },
    getRealTimeTask: function(bid) {
        var task = new (lib.smis_Task.getClass())(this.intId);
        task.inRecord = {
            id: "4",
            title: "my title",
            description: "my description",
            severity: "Low",
            change: "change1",
            "special.field": "special value"
        };
        task.direction = lib.smis_Constants.MAPPING_DIRECTION_LEFTRIGHT();

        return task;
    },

    preProcess: function(task) {
        this.log.debug("SurveyManager","preProcess");
        task.destObject = task.inRecord;
        task.inRecord = null;
        return true;
    },

    getDestObj: function() {

        return this.obj;
    },

    getAction: function() {
        return "insert";
    },

    process: function(task) {
        this.log.debug("SurveyManager","process");
        // stack destObj of task to EPAdapter.outObj
        this.EPAdapter.cacheRecords(task);
        return true;
    },

    postProcess: function() {
        this.log.debug("SurveyManager","postProcess");

        var tasks = this.result.tasks;
        for(var i=0; i<tasks.length; i++){

            if( this.result.fail ){

                tasks[i].retry++;
                lib.smis_TaskManager.updateTask(tasks[i]);

            }
            else{

                lib.smis_TaskManager.removeTask(tasks[i]);
            }

        }

    },

    initParams: function() {
    //call this.configItem.setConfigParameterValue to set param's value
    },

    isScheduleBased: function() {
        return true;
    },

    finalize: function() {
        // trigger EPAdapter.sendReords()
        this.log.debug("SurveyManager","finalize");
        try{

            this.result = this.EPAdapter.sendRecords();

        }catch(x){

            this.log.error("SurveyManager", x);
            return null;
        }

    },

    stampLastClosedTime: function(task){

        this.log.debug("SurveyManager","stampLastClostTime");
        var module = this.configItem.getConfigParameterValue("dbdict");
        var moduleParameter = this.configItem.MODULE[module];
        var record = task.inRecord;

        // update surveyinstance close time
        var surveyinstance = new SCFile( "surveyinstance" );
        var RC = surveyinstance.doSelect( "instance.id=\"" + this.intId + "\"" );
        if( RC != RC_SUCCESS ) throw "Fatal error, no record found in surveyinstance table, can not update last.lose.time field which is important for next query.";

        surveyinstance["last.close.time"] =  system.functions.val( record[moduleParameter.closeTimeField], 3 );
        if( surveyinstance.doUpdate() != RC_SUCCESS ) throw "Fatal error, survey instance can not be updated.";

    },

    stampHistory: function(last_task){
        // set history field value,
        // instance.id was set on Manager initilization,
        
        this.log.debug("SurveyManager","stampHistory");

        var module = this.configItem.getConfigParameterValue("dbdict");
        var moduleParameter = this.configItem.MODULE[module];
        var record = last_task.destObject;
        this.history["last.ticket.close.time"] = system.functions.val( record[moduleParameter.closeTimeField], 3 );

        // set other history fields
        this.history.record_count        = ""+this.result.tasks.length;
        this.history.upload_response_msg = this.result.response;
        this.history.upload_status       = (this.result.fail)?"Failure":"OK";
        this.history.upload_time         = this.result.uploadTime;

        var rc = this.history.doInsert();
        if( rc != RC_SUCCESS ) this.log.error( "SurveyManager","stampHistory() " + RCtoString( rc ) );

    }

});



function getClass() {
    return SurveyManagerClass;
}