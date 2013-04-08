/******************************************************
* Module Name: Survey integration Connector for URL
* Function: connector functions
* Author: Ryan
* Version: 1.00
* Creation Date: Apr., 2013
*******************************************************/


var Class = lib.smis_Prototype.getClass();

var ConnectorClass = Class.create({

	initialize: function(surveyDefinition) {
	
		this.surveyDefinition = surveyDefinition;
	},
	
	process: function(task) {

		var log = this.surveyDefinition.getLogger();
  		log.debug("Survey_Connector_URL", "Sending out survey." + task.inRecord.surveyId);
  		
  		var mails = task.inRecord.mails;
  		for (var i = 0; i < mails.length; i++) {
  			
  			var rc = this.sendEmail(mails[i].emailAddress, mails[i].emailSubject, mails[i].emailBody)
  			//log.debug("Survey_Connector_URL", "Email Data - " + mails[i]);	
  		};
  		
		return true;
	},
	
	/*
	 prepare task data according to connector type
	*/
	prepareTaskData: function(taskData) {
		
		var log = this.surveyDefinition.getLogger();
  		log.debug("Survey_Connector_URL", "Prepare mail data" + task.inRecord.surveyId);

  		var rc = lib.Survey_Template.updateTask(taskData);
  		
	},
	
	/*
	 send the email per recipient
	*/
	sendEmail: function( recipient, subject, emailBody ) {

		var email = new SCFile("mail");

		email["user.to"] = recipient;
		email["user.from"] = system.functions.operator();
		email["date.to.send"] = system.functions.tod();
		email["status"] = "sent";
		email["subject"] = subject;
		email["application"] = "email";
		email["text"].push(emailBody);
		email["user.array"][0] = recipient;

		var paramNames = new SCDatum();
		var paramValues = new SCDatum();

		paramNames.push("record");
		paramValues.push(email);

		var rteReturnValue = "";
		var rc = system.functions.rtecall("callrad",
											rteReturnValue,
											"axces.email", //RAD app name
											paramNames,
											paramValues,
											false); //false to run in same thread, true to run in new thread

		return rc;

	}
  
  
});


function getClass() {return ConnectorClass;}