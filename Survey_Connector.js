/******************************************************
* Module Name: Survey integration Connector
* Function: connector functions
* Author: Tian, Shao-Qin
* Version: 1.00
* Creation Date: Mar., 2013
*******************************************************/


var Class = lib.smis_Prototype.getClass();

var ConnectorClass = Class.create({

	initialize: function(surveyDefinition) {
	
		this.surveyDefinition = surveyDefinition;
	},
	
	process: function(task) {
		var log = this.surveyDefinition.getLogger();
  		log.debug("Survey_Connector", "preparing survey task." + task.inRecord.surveyId);
		return true;
	},
	
	/*
	 prepare task data according to connector type
	*/
	prepareTaskData: function(taskData) {
	
	},

	sendLog: function(surveyId, ticketId, recipient, sendDate){
		lib.Survey_History.writeSurveySendLog(surveyId, ticketId, recipient, sendDate);
	},

	sendHistory: function(surveyId, status, surveyData, sendDate){
		lib.Survey_History.writeSurveySendHistory(surveyId, status, surveyData, sendDate);
	}
  
  
});


function getClass() {return ConnectorClass;}