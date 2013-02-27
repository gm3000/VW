/** @fileoverview dynamicFormGenerator

*   @author Pete Budic
*/



/** This function reads the option XML inside of the Catalog Item and sets the option names
* 	and descriptions in SC array format.
*
*	@param {File} fCatalogItem    - the svcCatalog record
*	@return Boolean success or failure
*   @type Boolean
*/
function setOptionFields( fCatalogItem )
{

  var xmlString;
  var xmlObject = new XML();
  var costString;

  if ( fCatalogItem.options == null || fCatalogItem.options=="" )
  	fCatalogItem.options = "<form></form>";
  // Walk through the nodes to get the names and descriptions
  {
  	xmlString = fCatalogItem.options;
  	if ( !xmlObject.setContent( xmlString ) )
  	{
  		fCatalogItem.options = "<form></form>";
  		return false;
  	}
  	var names = new Array();
  	var labels = new Array();
  	var valDesc = new Array();
  	
  	var parent = xmlObject.getParentNode();
  	var form = parent.getFirstChildElement();
  	var node = form.getFirstChildElement();
  	var i = 0;
  	while ( node != null )
  	{
  		names[i] = node.getAttributeValue("id");
  		
  		labels[i]= node.getAttributeValue("label");
  		
  		valDesc[i] = lib.dynamicFormValidation.setValidationText( names[i], fCatalogItem.option_validations );
		i++;
  		
  		node = node.getNextSiblingElement();
  	}
  }
  
  fCatalogItem.option_validations = lib.dynamicFormValidation.addButtonIds( fCatalogItem.option_validations );
  //print(fCatalogItem.options);
  fCatalogItem.options = addButtonIds( fCatalogItem.options, fCatalogItem.option_validations );
  fCatalogItem.option_names = names;
  fCatalogItem.option_desc = labels;
  fCatalogItem.option_validation_desc = valDesc;
  
  return true

}

/** This function adds a new user selection node to the options field in the catalog record
*
*	@param {File} fCatalogItem    - the svcCatalog record
*	@return Boolean success or failure
*   @type Boolean
*/
function addNewSelection( fCatalogItem, type, name, desc, options, labels, costs )
{
	var xmlString;
  	var xmlObject = new XML();
	var setType = type;
	var multi = false;
	var style;

	if ( setType == "multitext" )
	{
		setType = "text";
		multi = true;
	}
	
	if ( setType == "radio" )
	{
		setType = "select";
		style = "radio";
	}
	
	if ( setType == "combo" )
	{
		setType = "select";
		style = "combo";
	}
	
	if ( fCatalogItem.options == null || fCatalogItem.options=="" )
  		fCatalogItem.options = "<form></form>";
	
	if ( fCatalogItem.options != null )
	{
		xmlString = fCatalogItem.options;
		if ( !xmlObject.setContent( xmlString ) )
		{
			fCatalogItem.options = "<form></form>";
			return false;
		}
		
		
		var parent = xmlObject.getParentNode();
  		var form = parent.getFirstChildElement();
		
		var node = form.addElement( setType );
		node.setAttributeValue( "id", name );
		node.setAttributeValue( "label", desc);
		
		if ( multi == true )
			node.setAttributeValue( "multiline", "true" );
		
		if ( style != null )
			node.setAttributeValue( "style", style );
		
		fCatalogItem.option_costs = setCostAdj( fCatalogItem.option_costs, name, options, labels, costs )
		
		if ( options != null )
		{
			if (setType == "select" && style == "combo" )
			{
				var nullElement = node.addElement("option");
				nullElement.addAttribute("label","");
			}
					
			var lng = options.length();
		
			for (var i = 0; i < lng; i++ )
			{	
				if ( options[i] != null )
				{ 
					if ( setType == "select" )
					{
						
						var element = node.addElement( "option" );
						element.setValue(options[i]);
						
						if ( labels.length() >= i && labels[i] != null )
								{
									var myLabel = labels[i];
									var operand;
									
									if ( costs.length() > i )
									{
										if ( costs[i] != null && parseFloat( costs[i] ) != 0 && !isNaN( parseFloat( costs[i] ) ) )
										{	
											if ( costs[i] > 0 )
												operand = "+";
											else
												operand = "";
											myLabel = labels[i] + " [" + operand + lib.money.formatCurrency( costs[i], fCatalogItem.currency ) + "]";
										}
									}
									element.addAttribute("label", myLabel);
								}
								else
									element.addAttribute("label", options[i]);
					}
					if ( setType == "checkbox" )
					{
						
						if ( costs.length() > 0 )
						{
							var myLabel = labels[i];
							if ( costs[i] != null && parseFloat( costs[i] ) != 0 && !isNaN( parseFloat( costs[i] ) ) )
									{	
										if ( costs[i] > 0 )
											operand = "+";
										else
											operand = "";
										myLabel = labels[i] + " [" + operand + lib.money.formatCurrency( costs[i], fCatalogItem.currency ) + "]";
									}
							node.setAttributeValue( "label", myLabel);
						}
					}
				}
			}
		}
		
		if ( setType == "text" )
		{
			
			if ( fCatalogItem.option_validations != null )
				var validations = fCatalogItem.option_validations;
				var valXML = new XML();
				var valString = validations;
				if ( valXML.setContent( valString ) )
				{	
					
					var valNode = lib.xmlHelpers.getElement( valXML, name, "id" );
					if ( valNode != null )
					{
						if (valNode.getAttributeValue("matchField") != null && valNode.getAttributeValue("matchTable") != null && 
			     			valNode.getAttributeValue("matchField") != "" && valNode.getAttributeValue("matchTable") != "" )
			     			{
			     				node.setAttributeValue("button", 8001);
			     			}
					}
				}
		}
		
		fCatalogItem.options = xmlObject.toXMLString();
		  	
	}
return true;
}

/** This function removes a user selection node from the options field in the catalog record
*
*	@param {File} fCatalogItem    - the svcCatalog record
*   @param {String} id - The id of the node to be deleted.
*	@return Boolean success or failure
*   @type Boolean
*/
function removeSelection( fCatalogItem, id )
{
	var xmlObject = new XML();
	var validXML  = new XML();
	if ( fCatalogItem.options != null )
	{
		xmlString = fCatalogItem.options;
		if ( !xmlObject.setContent( xmlString ) )
		{
			fCatalogItem.options = "<form></form>";
			return false;
		}

		
		var parent = xmlObject.getParentNode();
  		var form = parent.getFirstChildElement();
  		
  		form = lib.xmlHelpers.removeChild( form, id, "id" );
  		
  		fCatalogItem.options = form.toXMLString();	
  		
  		if ( fCatalogItem.option_validations != null)
  		{
  			var validXMLString = fCatalogItem.option_validations;
  			if ( validXML.setContent( validXMLString ) )
  			{
  				validXML = lib.xmlHelpers.removeChild( validXML, id, "id" );
  				
  				
  				fCatalogItem.option_validations = validXML.toXMLString();
  			}
  		}
  		if ( fCatalogItem.option_costs != null)
  		{
  			var validXMLString = fCatalogItem.option_costs;
  			if ( validXML.setContent( validXMLString ) )
  			{
  				validXML = lib.xmlHelpers.removeChild( validXML, id, "id" );
  				
  				
  				fCatalogItem.option_costs = validXML.toXMLString();
  			}
  		}
	}
	
	return true;
}

/** This function returns the XML element that has the id attribute of the passed in String
*
*	@param 	{XML String} xmlString    - the xml that contains the dynamic form information
*   @param 	{String} id - The id of the node to be returned.
*	@return The element corresponding to the passed in ID.
*   @type 	XML
*/
function getElementById( xmlString, id )
{
	var element = new XML();
	element.setContent( xmlString );
	
	return lib.xmlHelpers.getElement( element, id, "id" );
}

/** This function replaces an existing user selection node to the options field in the catalog record
*
*	@param {File} fCatalogItem    - the svcCatalog record
*	@return XML String the new XML String
*   @type Boolean
*/
function replaceSelection( fCatalogItem, type, oldname, name, desc, options, labels, costs )
{		
	var xmlString;
  	var xmlObject = new XML();
  	var newXml = new XML();
  	var replaceXml = new XML();
	var setType = type;
	var multi = false;
	var style;
	
	xmlString = fCatalogItem.options;
	
	if ( setType == "multitext" )
	{
		setType = "text";
		multi = true;
	}
	
	if ( setType == "radio" )
	{
		setType = "select";
		style = "radio";
	}
	
	if ( setType == "combo" )
	{
		setType = "select";
		style = "combo";
	}
	
	if ( xmlString != null )
	{
		
		if ( !xmlObject.setContent( xmlString ) )
		{
			string= "<form></form>";
			return false;
		}
		
		
		var parent = xmlObject.getParentNode();
  		var form = parent.getFirstChildElement();
  		var node = form.getFirstChildElement();

		newXml.setContent("<form></form>");
		replaceXml.setContent("<form></form>");
		var newParent = newXml.getParentNode();
		var newForm = newParent.getFirstChildElement();

  		
  		
  		// We don't have a node.removeChild() function, so we have to rebuild the entire
  		// XML and leave out what we are removing.
  		while ( node != null )
  		{
  			if (node.getAttributeValue("id") != oldname )
  			{
  				newForm = lib.xmlHelpers.addChildElement( newForm, node );
  				
  			}
  			else
  			{ 
	  			var replacenode = replaceXml.addElement( setType );
				replacenode.setAttributeValue( "id", name );
				replacenode.setAttributeValue( "label", desc);
				
				if ( multi == true )
					replacenode.setAttributeValue( "multiline", "true" );
				
				if ( style != null )
					replacenode.setAttributeValue( "style", style );
				
				fCatalogItem.option_costs = setCostAdj( fCatalogItem.option_costs, name, options, labels, costs );
				
				if ( fCatalogItem.option_costs == null) 
					fCatalogItem.option_costs = "<costs/>";
				
				if ( options != null )
				{
					if (setType == "select" && style == "combo" )
					{
						var nullElement = replacenode.addElement("option");
						nullElement.addAttribute("label","");
					}
					var lng = options.length();
					
					for (var i = 0; i < lng; i++ )
					{	
						if ( options[i] != null )
						{
							if ( setType == "select" )
								{
								var element = replacenode.addElement( "option" );
								element.setValue(options[i]);
								element.addAttribute("id", ""+i);
								if ( labels[i] != null )
								{
									var myLabel = labels[i];
									var operand;
									
									if ( costs.length() > i )
										if ( costs[i] != null && parseFloat( costs[i] ) != 0 && !isNaN( parseFloat( costs[i] ) ) )
										{
											{
												if ( costs[i] > 0 )
													operand = "+";
												else
													operand = "";
											}
										
											myLabel = labels[i] + " [" + operand + lib.money.formatCurrency( costs[i], fCatalogItem.currency ) + "]";
										}
									element.addAttribute("label", myLabel);
								}
								else
									element.addAttribute("label", options[i]);
								}
							if ( setType == "checkbox" )
								{
									
									if ( costs.length() > 0 )
									{
										var myLabel = labels[i];
										if ( costs[i] != null && parseFloat( costs[i] ) != 0 && !isNaN( parseFloat( costs[i] ) ) )
												{	
													if ( costs[i] > 0 )
														operand = "+";
													else
														operand = "";
													myLabel = labels[i] + " [" + operand + lib.money.formatCurrency( costs[i], fCatalogItem.currency ) + "]";
												}
										replacenode.setAttributeValue( "label", myLabel);
									}
								}
						}
					}
				}
				
				newForm = lib.xmlHelpers.addChildElement( newForm, replacenode );
	  		}
  			node = node.getNextSiblingElement();	
  		}
		
		fCatalogItem.options=newXml.toXMLString();
		return true
		  	
	}
return true;
}

/**  This function is used to set the dynamic form content for bundle options.
*
*	@param {Record} record - The current bundle record
*/
function setBundleOptions( record )
{
	if ( record.type != "bundle" )
		return;
	var add = false;

    // Initialize the localized version of the catalog record
	var svcDisplay = new SCFile("svcDisplay");
	var sql = "name=\""+record.name+"\" and syslanguage~=\"xxx\"";
	
	if ( svcDisplay.doSelect(sql) == RC_SUCCESS )
	{
		do
		{		

			var options = new XML();
			
			record.option_instructions="";
			options.setContent("<form></form>");
			
			for (var i = 0; i < record.bundle.length(); i++ )
			{
				if ( record.bundle[i].item_option == "mandatory" )
				{
					var node = options.addElement( "label" );
					node.setAttributeValue("id", "opt"+ (i + 1) );
					var label="("+record.bundle[i].item_quantity+") "+getLocalizedName( record.bundle[i].item_name, svcDisplay.syslanguage );
					node.setValue( label ); 
				}

				
				else if ( record.bundle[i].item_option == "default" )
				{
					var node = options.addElement( "checkbox" );
					node.setAttributeValue("id", "opt" + (i + 1) );
					var label = "("+record.bundle[i].item_quantity+") "+getLocalizedName( record.bundle[i].item_name, svcDisplay.syslanguage );
					
					if ( record.bundle[i].item_cost_adj !=0 && record.bundle[i].item_cost_adj != null )
           			{
						var operator;
						if ( record.bundle[i].item_cost_adj > 0 )
							operator = "+";
						label = label + " [" + operator + lib.money.formatCurrency( record.bundle[i].item_cost_adj, record.currency )+"]";
					}
					node.setAttributeValue("label", label);
					node.setValue("true");
				}	
				
				else if ( record.bundle[i].item_option == "optional" )
				{
					var node = options.addElement( "checkbox" );
					node.setAttributeValue("id", "opt"+(i + 1) );
					var label = "("+record.bundle[i].item_quantity+") "+getLocalizedName( record.bundle[i].item_name, svcDisplay.syslanguage );
					
					if ( record.bundle[i].item_cost_adj !=0 && record.bundle[i].item_cost_adj != null )
					{
						var operator;
						if ( record.bundle[i].item_cost_adj > 0 )
							operator = "+";
						label = label + " [" + operator + lib.money.formatCurrency( record.bundle[i].item_cost_adj, record.currency )+"]";
					}
					node.setAttributeValue("label", label);
				}
			}	

			svcDisplay.options = options.toXMLString();

			svcDisplay.doUpdate() == RC_SUCCESS;

		}
		
		while ( svcDisplay.getNext() == RC_SUCCESS )
	}
}

/**  This function is used to determine if a bundle should be ordered.
*
*	@param {Record} record - The current bundle record
*   @returns  Whether or not the bundle line should be added.
*   @type Boolean
*/
function checkBundle( record, line, level, bundleItem )
{
	var form = new XML();
	var recordForm = new XML();	
	var strName = system.functions.filename(record);
	
	if (strName == "svcCatalog")
	{
		var sql = "name=\"" + record.name + "\"";
		record = new SCFile("joinsvcDisplay");
		record.doSelect(sql);
	}
	
	if ( level > 1 && bundleItem != null )
	{
		form.setContent( bundleItem );
	}
	else if ( record.options != null )
	{
		form.setContent( record.options );	
	}
	else
	{
		form = null;
	}
	
	if ( form )
	{
		var node = lib.xmlHelpers.getElement( form, line, "id" );

		if ( node != null )
		{
			if ( node.getValue() == "true")
				return true;
			
			else // Otherwise we get the value from the cart item options
			{
				var name=node.getNodeName();
				var nodeLabel = node.getAttributeValue("label");

				if ( record.bundle_options != null )
				{
					recordForm.setContent( record.bundle_options ); 

					var bElement=lib.svcCatBundles.getBundleElement( recordForm, line, "id", name, nodeLabel )
                
					if ( bElement != null )
					{
						if (bElement.getValue() == "true" )
							return true;
					}
				}
			}		
		}
	}
	return false;
}

/** This function adds/modifies button ids for text elements that have match tables and fields.
*
*	@param {xmlString} 	-	the xml String containing the option information
*	@param {validationString} 	-	the xml String containing the validation information
*	@return The new xml String
*   @type xmlString
*/
function addButtonIds( xmlString, validationString )
{
	var xml = new XML();
	var valXML = new XML();
	
	if ( valXML.setContent( validationString ) )
	{
		if ( xml.setContent( xmlString ) )
		{
			var node = xml.getFirstChildElement();
			while ( node != null)
			{
				if ( node.getAttributeValue( "id" ) != null )
				{
					var valElement = lib.xmlHelpers.getElement( valXML, node.getAttributeValue( "id" ), "id" );
					if ( valElement != null )
						if ( valElement.getAttributeValue("button") != null && 
								valElement.getAttributeValue("button") != "0" )
							node.setAttributeValue( "button", valElement.getAttributeValue("button") );
				}
				
				node = node.getNextSiblingElement();
			}
			
			return xml.toXMLString();
		}
	}
	
	return xmlString;
}

/** This function creates or edits the cost XML associated with an option.
*
*	@param {costString} 	-	the xml String containing the cost information
*   @param {name}	- 				the name of the element to be added/modified in the cost information
*	@param {options}		-	the list of options that should be added
*	@param {labels} 		-	the labels of the options without the cost adjustments
*	@param {costs}			-	the cost adjustments associated to these options
*	@return The xmlString for the cost information
*   @type xmlString
*/
function setCostAdj( costString, name, options, labels, costs )
{
	
	var costObject = new XML();
	if ( costString == null )
		costString="<costs/>";
	
	if ( costObject.setContent( costString ) )
	{
		var node = new XML( "selectnode" );
		node.setAttributeValue( "id", name );
		if ( options != null )
		{
			for (var i = 0; i < options.length(); i++ )
			{
				var opt = new XML("option");
				opt.setValue( options[i] );
				if ( labels.length() >= i && labels[i] != null )
					opt.setAttributeValue("label", labels[i] );
				if ( costs.length() > 0 && costs[i] != null )
					opt.setAttributeValue("costadj", costs[i] );
					
				node = lib.xmlHelpers.addChildElement( node, opt );
			}	
		}
		costObject = lib.xmlHelpers.addReplaceChild( costObject, node, "id" );
		
	}
	
	return costObject.toXMLString();
}

/** This function returns an option cost if there is an associated cost adjustment.
*
*	@param {optionXML} 	-		the xml  containing the option information
*	@param {value} - 			the value of the option
*	@return The cost adjustment for that value
*   @type xmlString
*/
function getOptionCost( optionXML, value )
{
	var value;

	if (optionXML != null )
	{
	var node = optionXML.getFirstChildElement();

  	while ( node != null )
	  	{
	  		if ( node.getValue() == value )
	  		{
	  			return node.getAttributeValue("costadj");
	  		}
	  		node = node.getNextSiblingElement();
	  	}
  	}
	return null;
}

/** This function returns an option label if there is an associated cost adjustment.
*
*	@param {optionXML} 	-		the xml  containing the option information
*	@param {value} - 			the value of the option
*	@return The cost adjustment for that value
*	@return The  label
*   @type xmlString
*/
function getOptionLabel( optionXML, value )
{
	var value;

	if (optionXML != null )
	{
	var node = optionXML.getFirstChildElement();

  	while ( node != null )
	  	{
	  		if ( node.getValue() == value )
	  		{
	  			return node.getAttributeValue("label");
	  		}
	  		node = node.getNextSiblingElement();
	  	}
  	}
	return null;
}

/** This function sets the variable $L.connector.names list based on what has already been used
*   The list should not display the fields that have already been used once in user selection.
*
*	@param {aOptionnames} 	-	The array of fields already used in userselection for the catalog item
*	@return true
*   @type Boolean
*/
function getFieldNames( aOptionNames )
{
	
	if ( aOptionNames != null )
	{
        var myIndex = 0;
		var aNames = new Array();
	
		aNames = aOptionNames.toArray();
	
		for ( i = 0; i <aNames.length; i++ )
		{
			var strOption = aNames[i];

            myIndex = system.functions.index( strOption, system.vars.$L_connector_names )

	   		if ( myIndex > 0 )
	   			system.vars.$L_connector_names = system.functions._delete( system.vars.$L_connector_names, myIndex);
		}   		
	}	

    return true;
}


/** This function sets the option string based on the newly rearranged user selections by the user.
*   This is assuming the id (option.names) in the user selection list to be unique for each user selection.
*
*	@param {aOptionNames} 	-	The array of fields already used in userselection for the catalog item
*	@param optionXML        -	The xml  containing the option information.
*	@return true
*   @type Boolean
*/
function rearrangeOptionFields( aOptionNames, optionXML )
{

	var options = new XML();

	options.setContent("<form></form>");

	if ( aOptionNames != null && optionXML != null)
	{
        var xml = new XML();
		xml.setContent( optionXML );       
		
		var aIds = new Array();
	
		aIds = aOptionNames.toArray();
	
		for ( i = 0; i < aIds.length; i++ )
		{
			var node = lib.xmlHelpers.getElement( xml, aIds[i], "id" );

			if ( node != null )
				options = lib.xmlHelpers.addChildElement( options, node );
		}
		
		system.vars.$L_file.options = options.toXMLString();
	}
	
    return true;
    
}

/** This function returns the localized item name.
*
*	@param name 			-	The non localized name of the catalog item the catalog item
*	@param syslanguage      -	The language that the item should be searched on
*	@return displayName
*   @type String
*/
function getLocalizedName( name, syslanguage )
{

	if ( syslanguage == null || syslanguage == "")
		syslanguage = lib.svcCatalogLocalizeData.getCurrentLanguage();
		
	var fsvcDisplay = new SCFile( "svcDisplay" );
	var sql = "name=\""+name+"\" and syslanguage=\""+syslanguage+"\"";
	
	if ( fsvcDisplay.doSelect( sql ) == RC_SUCCESS )
	{
		return fsvcDisplay.displayName;
	}
	else
	{
		return name;
	}	
}

function checkUserSelectionExisted( name, oldName, actionType, record ) {
	var b = true;
	var sn = null;
	var xml = new XML();
	if( xml.setContent( record.options ) ) {
		if( "add" == actionType ) {
			sn = name;
		}else if( "edit" == actionType ) {
			if( name != oldName ) {
				sn = name;
			} 
		}
		if( sn != null ) {
			var elem = lib.xmlHelpers.getElement( xml.getDocumentElement(), name, "id" );
			b = ( elem == null );
		}
	}
	return b;
}

function checkPicklistDuplicated( pickList, pickListLabel, pickListCost ) {
	var b = true;
	var isValid = function( idx ) {
		var pl = ( pickList && idx < pickList.length() ? pickList[idx] : null );
		var pll = ( pickListLabel && idx < pickListLabel.length() ? pickListLabel[idx] : null );
		var plc = ( pickListCost && idx < pickListCost.length() ? pickListCost[idx] : null );
		b = ( ( pl != null && pll != null && plc != null ) || ( ! pl && ! pll && ! plc ) );
		return b;
	}
	if( pickList != null ) {
		for( var i = 0; b && i < pickList.length() - 1; i++ ) {
			if( isValid( i ) && pickList[i] ) {
				for( var j = i + 1; j < pickList.length(); j++ ) {
					if( pickList[i] == pickList[j] ) {
						b = false;
						break;
					}
				}
			}
		}
	}
	return b;
}

/*
* The cost in pick list must be a postive number
*
*/
function checkPicklistCost( pickListCost ){
	for (i = 0; i < pickListCost.length(); i++){
		if (pickListCost[i] != null && pickListCost[i] != ""){
			if (isNaN(pickListCost[i])){ //check if cost is number 
				return false;
			}
			var tmpNum = Number(pickListCost[i]);
			if (tmpNum < 0){ //check if cost is negative
				return false;
			}
		}
	}
	return true;
}
