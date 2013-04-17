
var eventOut;
var found;

function Survey_Connector_URLTest( name ) {	          	

	lib.JsUnit.TestCase.call( this, name );

}

function Survey_Connector_URLTest_setUp() 
{	          	

}

function Survey_Connector_URLTest_tearDown() 
{	          	
	if(found) eventOut.doDelete();
}

//  The following test is linked to QC#### 
//  It tests that ... 
function Survey_Connector_URLTest_testSendEmail() 
{		   
    
	var task = {
		inRecord:{
			mails:[{
				emailAddress:"jsunit_survey@hp.com",
				emailSubject:"JsUnit Subject",
				emailBody:"Hi This is Email Body"
			}],
			surveyId:"10001"
		}
	};

	var surveyDefinition = {
		getLogger: function() {
			return {
				info: function(prefix, message) {},
				error: function(prefix, message) {},
				debug: function(prefix, message) {},
				warn: function(prefix, message) {}
			};
		}
	};
	
	var connector = new (lib.Survey_Connector_URL.getClass())(surveyDefinition);

	connector.process(task);

	found = lookingForEventOut( "jsunit_survey@hp.com","JsUnit Subject", "Hi This is Email Body" );
	this.assertTrue("True test: Eventout found", found);


}

function lookingForEventOut(email, subject, body){

	eventOut = new SCFile("eventout");
	if(eventOut.doSelect("evtype=\"email\"") == RC_SUCCESS){

		do{
			
			if( eventOut.evfields.indexOf(email) != -1 ) return true;
		}
		while(eventOut.getNext() == RC_SUCCESS);

	}

	return false;

}

//  Code used by the JSUnit tests
Survey_Connector_URLTest.prototype = new lib.JsUnit.TestCase();
Survey_Connector_URLTest.glue( this );
Survey_Connector_URLTest.prototype.scope = this; 

function getScope() 
{
	return this;
}
