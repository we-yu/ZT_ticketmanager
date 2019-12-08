var CATCHER = "@taskbot"

function isBotMessage(tgtTxt) {
  return (tgtTxt[0] === CATCHER) ? true : false;
}

function textDivide(tgtText) {
  bodyText = tgtText;
  toBotText = bodyText.replace(/(,|\.)/gi, ' ');  // , and . replace to blank
  toBotText = toBotText.replace(/( +)/gi, ' ');   // Multiple blanks replace to single blank
  toBotText = toBotText.trim();                   // Remove blanks from head and tail.
  toBotText = toBotText.toLowerCase();
  botTextArray = toBotText.split(" ");
  reText = botTextArray.join(",");

  debugLog("Original TEXT :" + bodyText);
  debugLog("Replaced TEXT :" + toBotText);
  debugLog("Rebuild  TEXT :" + reText);

  return botTextArray;
}

function getCommandCode(tgtText) {
  cmdis = "read";
  return cmdis;
}

function doPost(e) {

  var prop = PropertiesService.getScriptProperties().getProperties();
  var json = JSON.parse(e.postData.contents);
  /* リクエスト用パラメータ・URLの準備 */
  var params = {
    headers : {"X-ChatWorkToken" : prop.API_TOKEN},
    method : "post"
  };

  var roomId = json.webhook_event.room_id;
  url = "https://api.chatwork.com/v2/rooms/" + roomId + "/messages";
  debugLog(url);
  debugLog(json);
  debugLog("Catcher = " + CATCHER);
  
  var bodyText = json.webhook_event.body;

  var dividedTxt = textDivide(bodyText);
  for (var i = 0 ; i < dividedTxt.length ; i++ ) {
    debugLog(i + " : " + dividedTxt[i]);
  }

  if (isBotMessage(dividedTxt) === false) {
    debugLog("a This is NOT bot message : " + bodyText);
    return false;
  }
  else
  {
    debugLog("a This is bot message : " + bodyText);
  }

  var cmd = getCommandCode(dividedTxt);
  debugLog("cmd == ", cmd, typeof cmd);
  var match = "read";

  debugLog(cmd, ":", match);
  debugLog(typeof cmd, ":", typeof match);


  var tgtFile  = SpreadsheetApp.getActiveSpreadsheet();
  var tgtSheet = tgtFile.getActiveSheet();
  debugLog(tgtFile.getName());
  debugLog(tgtSheet.getName());

  var startrow = 1;
  var startcol = 1;
  var lastrow = tgtSheet.getLastRow();
  var lastcol = tgtSheet.getLastColumn();
  
  var sheetdata = tgtSheet.getSheetValues(startrow, startcol, lastrow, lastcol);

  msgs = [];
  rowdata = "";
  for (var i = 0 ; i < lastrow ; i++ ){
      for (var j = 0 ; j < lastcol ; j++ ){
        rowdata += sheetdata[i][j];
        rowdata += " : ";
      }
    msgs.push(rowdata);
    rowdata = "";
  }
  for (var i = 0 ; i < msgs.length ; i++ ){
    debugLog(msgs[i]);
  }


  // -------------------------
  
  var accountId = json.webhook_event.account_id;
  var messageId = json.webhook_event.message_id;

  var body = '';
  body += '[code]';
  
  for (var i = 0 ; i < msgs.length ; i++ ){
    body += msgs[i] + '\n';
  }
  
  body += '[/code]';
  params.payload = {body :body};
  
  UrlFetchApp.fetch(url, params);
  
}

