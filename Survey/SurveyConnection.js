/******************************************************
* Module Name: Survey Connection
* Usage: connection functionality
* Author: Liu, Yong-Liang
* Version: 1.00
* Creation Date: Oct, 2011
*******************************************************/

//some constants
var HTTP_GET_ACTION="GET";
var HTTP_POST_ACTION="POST";
var CUST_URL="";
var CUST_USERNAME = "";
var CUST_PASSWORD = "";

var CustomerSat_Parameter=
	{"url":"https://apiconnectservices.customersat.com/WebConnectService.svc/"
	,"username":"DLee"
	,"password":"DeLeeHP11"
	,"query":"(incident.id=\"SD10001\" or incident.id=\"SD10004\") and open=\"Closed\""
	,"module":"incidents"
	,"surveyID":"10012"
	};

/**
	set URL for web service.

	@param url, url
*/
function setServiceURL(url){
	if(url!=null){
		if(url.match("/$")!="/"){
			CUST_URL=url+"/";
		}else{
			CUST_URL=url;
		}
	}
}

/**
	set username for web service.

	@param url, url
*/
function setServiceUserName(username){
	if(username!=null){
		CUST_USERNAME=username;
	}
}

/**
	set URL for web service.

	@param url, url
*/
function setServicePassword(password){
	if(password!=null){
		CUST_PASSWORD=password;
	}
}
/**
	Assembly of http request headers.
	@param user, username for authorization;
	@param password, password for authorization;

	@return an array representing the headers.

	@author Liu,Yong-Liang
*/
function getHTTPHeaders(user,password) {
        var list =new Array();
        list.push(new Header("Content-Type","text/plain"));

        var authHeader = new Header();
        authHeader.name = "Authorization";
        authHeader.value = "Basic " + lib.smis_CommonLib.encode64(user + ":" + password);

        list.push(authHeader);
        return list;
}

/**
	Do http request for REST web service.

	@param httpAction, HTTP ACTION, GET, POST, PUT, etc.;
	@param url, URL of the web service;
	@param httpHeaders, header fields for the http request;
	@param httpBody, body content for the http request;
	@param connTimeout, time out value for connect;
	@param sendTimeout, time out value for sending request;
	@param recvTimeout, time out value for receiving response;

	@return response messages.

	@author Liu,Yong-Liang
*/
function doRESTRequest(httpAction, url, httpHeaders, httpBody, connTimeout, sendTimeout, recvTimeout){

      var rawResponse = null;

      if(connTimeout == null){
            connTimeout = 15;
      }
      if(sendTimeout == null){
            sendTimeout = 15;
      }
      if(recvTimeout == null){
            recvTimeout = 15;
      }

      try {

           var rawResponse = doHTTPRequest(httpAction, url, httpHeaders, httpBody, connTimeout, sendTimeout, recvTimeout);

        return rawResponse;

      } catch( ex ) {
            print( "execption: " + ex );
            throw ex;
      }
}

/**
	Do http POST request for Survey - CustomerSat web service.

	@param url, URL of the web service;
	@param requestBody, body content for the http request;

	@return response messages.

	@author Liu,Yong-Liang
*/
function doSurveyPOSTRequest(url,requestBody){
	try {

           var rawResponse = doRESTRequest(HTTP_POST_ACTION, url, getHTTPHeaders(CUST_USERNAME,CUST_PASSWORD), requestBody, null, null ,null);

        return rawResponse;

      } catch( ex ) {
            print( "execption: " + ex );
            throw ex;
      }

}

/**
	Do http GET request for Survey - CustomerSat web service.

	@param url, URL of the web service;

	@return response messages.

	@author Liu,Yong-Liang
*/
function doSurveyGETRequest(url){
	try {

           var rawResponse = doRESTRequest(HTTP_GET_ACTION, url, getHTTPHeaders(CUST_USERNAME,CUST_PASSWORD), null, null, null ,null);

        return rawResponse;

      } catch( ex ) {
            print( "execption: " + ex );
            throw ex;
      }

}

/**
	Uploading of variables to CustomerSat. the values are in a text file.

	@param sid, the ID of the survey;
	@param path, local path containing the text file;

	@return response messages.

	@author Liu,Yong-Liang
*/
function uploadVariablesByFile(sid,path){
	var fileName=path.replace(/(.*[\/|\\\\]){0,}([^\.]+\.*)/ig,"$2");
	var url=CUST_URL+"sampledata?SID="+sid +"&FileName="+fileName;
	try	{
		var requestBody=readFile(path,"t");
		var response = doSurveyPOSTRequest(url,requestBody);
		return response==null?"Upload failure.":response;
	}
	catch ( e )
	{
		print( "survey request failed with exception \n" + e );
	}
}


/**
	Uploading of variables to CustomerSat. the values are in a text file.

	@param sid, the ID of the survey;
	@param variable, variables to be uploaded;
	@param fileName, the name of the text file;

	@return response messages.

	@author Liu,Yong-Liang
*/
function uploadVariables(sid,variables,fileName,log){
	if(fileName==null){
		fileName=sid;
	}
	var url=CUST_URL+"sampledata?SID="+sid +"&FileName="+fileName;
	try	{
		var response = doSurveyPOSTRequest(url,variables);
		log.debug(response );
		return response==null?"Upload failure.":response;
	}
	catch ( e )
	{
		log.debug(e );
		print( "survey request failed with exception \n" + e );
		throw e;
	}
}

/**
	get file upload status for a specific file denoted by fileId.

	@param fileId, the ID of the file given by the CustomerSat.
	@return an string representing the status.

	@author Liu,Yong-Liang
*/
function getUploadStatus(fileId){
	var url=CUST_URL+"sampledatastatus?FileID="+fileId;
	try	{
		var response = doSurveyGETRequest(url);
		return getSurveyStatusString(response);
	}
	catch ( e )
	{
		print( "survey request failed with exception \n" + e );
		return null;
	}
}

/**
	get the string representing the survey status responded.

	@param xml, response in xml format.

	@return a string.

	@author Liu,Yong-Liang
*/
function getSurveyStatusString( xml )
{
	var statusObject=new XML();
	statusObject.setContent(xml);
	var statusString="";
	var child = statusObject.getFirstChildElement();

	while( child != null )
	{
		var nodeName = child.getNodeName();
		var nodeValue = child.getNodeValue();
		statusString+=nodeName + " : " + nodeValue + "\n";

		child = child.getNextSiblingElement();
	}
	return statusString;
}

/**
	test the connection to the external web service.
	use getUploadStatus() to do the real test.

	@param param, the parameters for configuration of the connection.
	@return an string representing the status.

	@author Liu,Yong-Liang
*/
function testConnection(param){
	setServiceURL(param.url);
	setServiceUserName(param.username);
	setServicePassword(param.password);
	var status=getUploadStatus(26);
	var connectionResult= status!=null?"Connection test successfully.":"Connection test failure.";
	return connectionResult;

}
//print(testConnection(CustomerSat_Parameter));
