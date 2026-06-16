/**
 * Main function to build the Gmail Add-on UI.
 */
function buildAddOn(e) {
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Add Pipeline Note"));

  var section = CardService.newCardSection();

  // 1. Create the dropdown (pop-up menu)
  var selectionInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle("Select Opportunity")
    .setFieldName("pipelineSelection");

  // Fetch data from the database table
  var pipelineData = getPipelineData();
  
  // Populate the dropdown menu
  pipelineData.forEach(function(row) {
    // We stringify the ID and Name together so we can pass both to the webhook easily
    var valueString = JSON.stringify({ id: row.id, name: row.name });
    selectionInput.addItem(row.name, valueString, false);
  });

  // 2. Create the submit button
  var action = CardService.newAction().setFunctionName("submitToWebhook");
  var button = CardService.newTextButton()
    .setText("Add Note")
    .setOnClickAction(action);

  section.addWidget(selectionInput);
  section.addWidget(button);
  card.addSection(section);

  return card.build();
}

/**
 * Callback function executed when the user clicks the button.
 */
function submitToWebhook(e) {
  // TODO: Add your Webhook URL here
  var WEBHOOK_URL = "https://your-webhook-url.com/endpoint";

  // Parse the selected dropdown value
  var selectionStr = e.formInput.pipelineSelection;
  if (!selectionStr) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Please select an item first."))
      .build();
  }
  
  var selectedItem = JSON.parse(selectionStr);

  // Authenticate temporary, secure access to the currently open message
  var accessToken = e.messageMetadata.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  
  // Fetch the email content
  var messageId = e.messageMetadata.messageId;
  var message = GmailApp.getMessageById(messageId);
  
  var fromAddress = message.getFrom();
  var textContent = message.getPlainBody() || ""; // Returns empty string if no plain text part exists

  // Build the JSON Payload
  var payload = {
    "name": selectedItem.name,
    "ID": selectedItem.id,
    "fromAddress": fromAddress,
    "textContent": textContent,
    "messageID": messageId
  };

  // Format the Webhook request
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  // Send the request and alert the user
  try {
    UrlFetchApp.fetch(WEBHOOK_URL, options);
    
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Webhook sent successfully!"))
      .build();
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Error: " + error.message))
      .build();
  }
}

/**
 * Fetches data from an Apps Script Database/Google Sheet.
 */
function getPipelineData() {
  /*
  // --- USE THIS CODE IF YOUR DATABASE IS A GOOGLE SHEET ---
  // Replace 'YOUR_SPREADSHEET_ID' with the actual ID from your Google Sheet URL
  
  var sheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID').getSheetByName('pipeline');
  var data = sheet.getDataRange().getValues();
  var results = [];
  
  // Assuming Row 1 contains headers and data starts on Row 2
  // Adjust the [0] and [1] indexes based on where your ID and Name columns actually sit
  for (var i = 1; i < data.length; i++) {
    results.push({
      id: data[i][0],   // E.g., Column A
      name: data[i][1]  // E.g., Column B
    });
  }
  return results;
  */

  // --- MOCK DATA ARRAY FOR IMMEDIATE TESTING ---
  return [
    { id: "101", name: "Initial Contact" },
    { id: "102", name: "Proposal Sent" },
    { id: "103", name: "Closed Won" }
  ];
}