/******************************************************
* Module Name: SMIS SurveyController
* Function: provide sucrvey specific workflow control
* Author: Huang, Hao
* Version: 1.00
* Creation Date: Oct, 2011
*******************************************************/

var Class = lib.smis_Prototype.getClass();

var ControllerClass = Class.create({
  initialize: function(configItem) {

	// initialize moudule specific parameters which will be used in different places
        configItem.MODULE = {

            "incidents":{"contactField":"callback.contact","sortField":["close.time"],"closeTimeField":"close.time"},
            "probsummary":{"contactField":"contact.name","sortField":["close.time"],"closeTimeField":"close.time"}

        };

        configItem.history = new SCFile("surveyuploadhistory");
        configItem.RECORD_LIMIT = 0; //use this parameter to limit records count when query from the module table
        configItem.is921 = lib.SurveyConfig.is921();

        this.configItem = configItem;
	this.log = this.configItem.getLogger();


  	try {
  		var managerName = this.configItem.mgrName;

                //this.mapping = new (lib.smis_FieldMappingProcessor.getClass())(this.configItem);
                //this.configItem.mapping = this.mapping.mapping;

                eval("this.manager = new (lib." + managerName + ".getClass())(this.configItem);");

  	} catch (e) {

  		this.log.error("SurveyController", e);
  	}
  },

  /**
  *	Default work flow
  */
  startup: function() {

  	try {
		this.beforeExcute();
		this.doExcute();
		this.afterExcute();

  	} catch (e) {

  		this.exceptionCatch(e);
  	}


  },



  beforeExcute: function() {

      //set instance status to Running
      lib.smis_ConfigurationManager.setInstanceStatus( this.configItem.intId, lib.smis_Constants.INSTANCE_STATUS_RUNNING() );

  },

  doExcute: function() {
  	this.log.debug("SurveyController","doExcute");
  	//throw "Test Error";

  	//print("------------before-----------");
   	//this.debugInfo("SMAdater", this.manager.SMAdater.getRecords());
  	//this.debugInfo("EPAdapter", this.manager.SMAdater.getRecords());

  	this.manager.appendTasks();
  	var tasks = lib.SurveyConfig.readTasks(this.configItem.intId);// use customized readtasks function from SurveyConfig
  	if (tasks.length > 0) {

                //control the tasks < 5000
                var length = (tasks.length >= 5000)? 5000 : tasks.length;
  		for (var i = 0; i < length; i++) {

  			var task = tasks[i];
                        this.manager.preProcess(task);
  			this.manager.process(task);

  		}

                this.manager.finalize();
                this.manager.stampHistory(tasks[i-1]);
                this.manager.postProcess();
  	}


  },

    /**
  *	Run-Now work flow for single upload history record :)
  */
  runnow: function(id) {

        this.log.debug("Manual_Controller","runnow()");
        var re = false;

        //check if instance is running
        if( this.configItem.status == lib.smis_Constants.INSTANCE_STATUS_RUNNING() ){

            print( "Warnning: This Survey Instance is running right now, please retry several minutes later." );
            return false;

        }

        if( this.configItem.status == lib.smis_Constants.INSTANCE_STATUS_DISABLE() ){

            print( "Warnning: This Survey Instance is disabled, please retry after it is enabled." );
            return false;

        }

        this.startup();

        return re;
  },

    /**
  *	Run Now invoketion flow
  */
  runrealtime: function(bid) {
  	var task = this.manager.getRealTimeTask(bid);
	var inRecord = task.inRecord;

  	var success = false;
  	var ret = this.mapping.validate(inRecord, task.direction);
    if (ret)
    {
  	  var outRecord = this.mapping.getOutRecord(inRecord, task.direction);
  	  task.outRecord = outRecord;
  	  if (this.manager.preProcess(task)) {
	  	  var destObject = this.manager.getDestObj();
	  	  var action = this.manager.getAction();
	  	  var smisContext = new Object();
	  	  smisContext["action"]=action;

	  	  this.mapping.setFieldValues(inRecord, outRecord, destObject, smisContext, task.direction);

	  	  task.destObject = destObject;
	  	  success = this.manager.process(task);
	  	  this.manager.postProcess(task);
  	  } else {
  	  	  this.log.warn("SurveyController","manager preProcess failed. Ignore this record.");
  	  }
    }
    this.manager.finalize();

    return success;
  },

  afterExcute: function() {

      //set instance status to Sleeping
      lib.smis_ConfigurationManager.setInstanceStatus( this.configItem.intId, lib.smis_Constants.INSTANCE_STATUS_SLEEPING() );

  },

  exceptionCatch: function(e) {

      this.log.info("SurveyController", e);
      lib.smis_ConfigurationManager.setInstanceStatus( this.configItem.intId, lib.smis_Constants.INSTANCE_STATUS_SLEEPING() );
  }

});



function getClass() {return ControllerClass;}