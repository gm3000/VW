require 'testframe.rb'
require 'ServiceManager/web_client_fixture'
require 'ServiceManager/constants'
require 'ServiceManager/soap_client_fixture'
require File.dirname(__FILE__) + '/../lib/VMUsibilityER_Utilities'
require File.dirname(__FILE__) + '/../lib/VMUsibilityER_Constants'



class MyTest < TestFrame
  def setup
    summary "Test save interaction with mixed merge."

    # @interaction = BusinessLogic::ProblemManagement.new
    @wcf = ServiceManager::WebClientFixture.new
    @wcf.open WEB_SITE
    @wcf.login SYSTEM_ADMIN

    @postfix = Time.now.to_i.to_s[5..-1]

    @db = DB.new

  end

  def teardown
    @wcf.logout()
    @wcf.close()
  end

  def test
    step "Prepare a testing interaction ticket"
    ticketsm = Interaction.create({
    "Contact" => "AARON, JIM",
    "Category" => "complaint",
    "Area" => "service delivery",
    "Subarea" => "availability",
    "Service Recipient" => 'AARON, JIM',
    "Notify By" => "None",
    "Impact" => 2,
    "Urgency" => 2,
    "Affected Service" => "Applications",
    "Title" => "Auto interaction title #{@postfix}",
    "Description" => "Auto interaction description #{@postfix}"
    })

   
    step "Open the ticket in webpage."
    openInteraction(ticketsm.interactionID)
    step "Manually updates the ticket"
    @ticket_notifyby = "E-mail"
    @ticket_service = "MyDevices"
    @wcf.detail.setText("instance/callback.type",@ticket_notifyby)

    @wcf.detail.setText("instance/affected.item",@ticket_service)
    @wcf.detail.setText("var/update.action/update.action","User Updates")

    step "Backend Process update the ticket to cause conflicts on text field."
    @backend_notifyby = "Telephone"
    @backend_solution = "Backend RESOLUTION_#{@postfix}"
    updateBySQL 'INCIDENTSM1',{"INCIDENT_ID"=>ticketsm.interactionID},{"RESOLUTION"=>@backend_solution,'CALLBACK_TYPE'=>@backend_notifyby},{'SYSMODTIME'=>'CURRENT_TIMESTAMP'},{'SYSMODCOUNT'=>1}

    step "User submit the modification"
    submitModification

    step "User chose to use User Updates. It is by defalut, no need do operations."

    step "Submit Merge."
    @wcf.toolbar.click 'OK'

    check "Verify that message about merge is displayed."
    # assert(@wcf.messages.getLines[0],MSG_MANUAL_MERGE)

    check "Verify that ticket edit form is displayed with user's selection."
    final_notifyby = @wcf.detail.getText("instance/callback.type")
    assert(@ticket_notifyby,final_notifyby)
    
    final_service = @wcf.detail.getText("instance/affected.item")
    assert(@ticket_service,final_service)
    
    final_solution = @wcf.detail.getText("instance/resolution/resolution")
    assert(@backend_solution,final_solution)

    step "Submit final Updates. (Provide updates first, it get lost when come back to edit form.)"
    @wcf.detail.setText("var/update.action/update.action","User Updates")
    @wcf.toolbar.click "Save & Exit"

    check "Ticket is saved successfully."

     openInteraction(ticketsm.interactionID)

     final_notifyby = @wcf.detail.getText("instance/callback.type")
    assert(@ticket_notifyby,final_notifyby)
    
        
    final_service = @wcf.detail.getText("instance/affected.item")
    assert(@ticket_service,final_service)
    
    final_solution = @wcf.detail.getText("instance/resolution/resolution")
    assert(@backend_solution,final_solution)
    

    step "Manually updates the ticket"
    @ticket_solution = "Solution Manual updates on webpage_#{@postfix} 22"
    @wcf.detail.setText("instance/resolution/resolution",@ticket_solution)

    @wcf.detail.setText("var/update.action/update.action","User Updates")

    step "Backend Process update the ticket to cause conflicts on text field."
    @backend_solution2 = "Solution backend updates on webpage_#{@postfix} 22"

    updateBySQL 'INCIDENTSM1',{"INCIDENT_ID"=>ticketsm.interactionID},{"RESOLUTION"=>@backend_solution2},{'SYSMODTIME'=>'CURRENT_TIMESTAMP'},{'SYSMODCOUNT'=>1}

    step "User submit the modification"
    submitModification

    step "User chose to use backend Updates."
    conflictsData = getConflictsData
    @wcf.detail.subframe.radio(:id,conflictsData["Solution"]["Radio_Db"]).click
    step "Submit Merge."
    @wcf.toolbar.click 'OK'

    check "Verify that message about merge is displayed."
    # assert(@wcf.messages.getLines[0],MSG_MANUAL_MERGE)

    check "Verify that ticket edit form is displayed with user's selection."
    final_solution = @wcf.detail.getText("instance/resolution/resolution")
    assert(@backend_solution2,final_solution)

    step "Submit final Updates. (Provide updates first, it get lost when come back to edit form.)"
    @wcf.detail.setText("var/update.action/update.action","User Updates")
    @wcf.toolbar.click "Save & Exit"

    # assert(@wcf.messages.getLines[0] =~ /Change.*Updated.*/,nil)
    check "Ticket is saved successfully."
     openInteraction(ticketsm.interactionID)

    final_solution = @wcf.detail.getText("instance/resolution/resolution")
    assert(@backend_solution2,final_solution)
  end
end

MyTest.new.run