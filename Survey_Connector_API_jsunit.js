var task={};
var surveyDefinition;
var connector;


function Survey_Connector_APITest( name ) {	          	

	lib.JsUnit.TestCase.call( this, name );

}

function Survey_Connector_APITest_setUp() 
{	          	
	task.inRecord = {
		"surveyId": "FAKESURVEY_API",
		"list":["aa|bb|cc","dd|ee|ff","gg|hh|ii"],
		"emailList":[{"ticketId":"SD0001","email":"aa@s.com"},{"ticketId":"SD0001","email":"aa@b.com"},{"ticketId":"SD0001","email":"aa@c.com"}],
		
		};
	surveyDefinition = {
		"surveyId": "FAKESURVEY_API",
		"keepConnection": false,
		"connectionUrl":"https://apiconnectservices.customersat.com/WebConnectService.svc/",
		"connectionUsername":"DLee",
		"connectionPassword":"DeLeeHP11",
		"connectorDefinition":{},
		"externalSurveyId":"11356",
		"connectorDefinition":{},
		getLogger: function() {
			return {
				info: function(prefix, message) {},
				error: function(prefix, message) {},
				debug: function(prefix, message) {},
				warn: function(prefix, message) {}
			}
		},
		calculateParameterSequence: function() {}
	};


	lib.Survey_Logger.storeSurveyDefinition(surveyDefinition);

	connector = new (lib.Survey_Connector_API.getClass())(surveyDefinition);
}

function Survey_Connector_APITest_tearDown() 
{	          	
	var his = new SCFile("SurveySendHistory");
	if(his.doSelect("surveyId=\"FAKESURVEY_API\"") == RC_SUCCESS) his.doDelete();
}

//  The following test is linked to QC#### 
//  It tests that ... 
function Survey_Connector_APITest_testProcess() 
{		   
    
	var r = connector.process(task);
    this.assertFalse("False test: connecor process failed", r);

    var his = new SCFile("SurveySendHistory");
	this.assertEquals("API get history", RC_SUCCESS, his.doSelect("surveyId=\"FAKESURVEY_API\""));
	this.assertEquals("API get status","Fail",his.status);
}

//  Code used by the JSUnit tests
Survey_Connector_APITest.prototype = new lib.JsUnit.TestCase();
Survey_Connector_APITest.glue( this );
Survey_Connector_APITest.prototype.scope = this; 

function getScope() 
{
	return this;
}
