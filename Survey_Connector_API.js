/******************************************************
* Module Name: Survey integration Connector API
* Function: connector functions
* Author: Ryan
* Version: 1.00
* Creation Date: Mar., 2013
*******************************************************/


var Class = lib.smis_Prototype.getClass();

var ConnectorClass = Class.create(lib.Survey_Connector.getClass(),{

	initialize: function(surveyDefinition) {
	
		this.surveyDefinition = surveyDefinition;
		this.sid = surveyDefinition.externalSurveyId;
		this.getConnectionInfo();
		this.log = surveyDefinition.getLogger();

	},
	
	process: function(task) {
		 
  		this.log.debug("Survey_Connector_API", "processing survey task." + task.inRecord.surveyId);

  		var uploadBody=task.inRecord.list.join("\n");
  		var rc = true;
  		
  		try{

  			if( this.url.charAt( this.url.length -1 ) != "/" ) this.url += "/";

            lib.Survey_MarketTools.setServicePassword(this.pass);
            lib.Survey_MarketTools.setServiceUserName(this.username);
            lib.Survey_MarketTools.setServiceURL(this.url);

            var response = lib.Survey_MarketTools.uploadVariables(this.sid, uploadBody, this.sid+".txt",this.log);
            if(response == "Upload failure." || !response) rc = false;

            this.log.debug( "Survey_Connector_API: Response \n",response );


  		}catch(e){

  			rc = false;
  			this.log.error("Survey_Connector_API: Response \n", e);

  		}finally{

  			var emailList = task.inRecord.emailList;
  			var status = rc?"Success":"Fail";
  			var surveyId = task.inRecord.surveyId;
  			var date = new Date();

  			//send history
  			var historyText = [];
  			for(var i = 0; i<emailList.length; i++){
  				historyText.push("Ticket ID: " + emailList[i].ticketId + " | " + "Recipient: " + emailList[i].email);
  				//sendlog
  				if(rc) this.sendLog(surveyId, emailList[i].ticketId, emailList[i].email, date);
  			}

  			this.sendHistory(surveyId, status, historyText.join("\n"), date );

  		}
  		
		return rc;
	},
	
	/*
	 prepare task data according to connector type
	*/
	prepareTaskData: function(map) {
		this.log.info("Survey_Connector_API", "preparing task data");
		var parameters = this.surveyDefinition.calculateParameterSequence();
		var template = "";
		var SEPARATE = "|";
		for (var i = 0; i < parameters.length; i++) {
			if (i < parameters.length-1)
				template += "{"+parameters[i]+"}" + SEPARATE;
			else
				template += "{"+parameters[i]+"}";
		}
		
		var list = lib.Survey_Template.renderAPITemplate(template, map);
		
		return list;
	},

	getConnectionInfo: function(){

		var survey = this.surveyDefinition;
		var connector = this.surveyDefinition.connectorDefinition;

		this.url 		= (survey.keepConnection)? connector.url : survey.connectionUrl;
		this.username 	= (survey.keepConnection)? connector.username : survey.connectionUsername;
		this.pass 		= (survey.keepConnection)? connector.password : survey.connectionPassword;

	}
  
  
});


function getClass() {return ConnectorClass;}