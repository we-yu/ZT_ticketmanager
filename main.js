var CATCHER = "@taskbot"

function sandBox() {
  var txt;
  txt = "abcdefghijklmnopqrstuvwxyz";
  Logger.log(txt);
  Logger.log(txt.slice(0, 10));
}

function isBotMessage(tgtTxt) {
  return (tgtTxt[0] === CATCHER) ? true : false;
}

function padString(tgtText, width, m) {
  padWidth = width - 1;
  width = width * -1;
  padding = "";
  for (var i = 0 ; i < padWidth ; i++ ){
    padding = padding + m;
  }

  padTxt = (padding + tgtText).substr(width);
  return padTxt;
}

/**
 右埋めする処理
 指定桁数になるまで対象文字列の右側に
 指定された文字を埋めます。
 @param val 右埋め対象文字列
 @param char 埋める文字
 @param n 指定桁数
 @return 右埋めした文字列
**/
function paddingright(val,char,n){
  for(; val.length < n; val+=char);
  return val;
 }

function getTodays0000(){
  var _d = new Date();
  var  d = new Date(_d.getFullYear(), _d.getMonth(), _d.getDate(), 0, 0, 0);
  return d;
}
 
function textDivide(tgtText) {
  bodyText = tgtText;
  toBotText = bodyText.replace(/(,|\.)/gi, ' ');  // , and . replace to blank
  toBotText = toBotText.replace(/( +)/gi, ' ');   // Multiple blanks replace to single blank
  toBotText = toBotText.trim();                   // Remove blanks from head and tail.
  toBotText = toBotText.toLowerCase();
  botTextArray = toBotText.split(" ");
  reText = botTextArray.join(",");

  // debugLog("Original TEXT :" + bodyText);
  // debugLog("Replaced TEXT :" + toBotText);
  // debugLog("Rebuild  TEXT :" + reText);

  return botTextArray;
}

function getCommandCode(tgtText) {
  cmdis = tgtText[1];
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
  // debugLog(url);
  // debugLog(json);
  // debugLog("Catcher = " + CATCHER);
  
  var bodyText = json.webhook_event.body;

  var dividedTxt = textDivide(bodyText);

  if (isBotMessage(dividedTxt) === false) {
    debugLog("a This is NOT bot message : " + bodyText);
    return false;
  }
  else
  {
    debugLog("a This is bot message : " + bodyText);
  }

  debugLog(dividedTxt[0]);
  debugLog(dividedTxt[1]);
  debugLog(dividedTxt[2]);
  var cmd = getCommandCode(dividedTxt);
  var opt = dividedTxt[2];
  // debugLog("cmd == ", cmd, typeof cmd);
  var readCmd = "read";
  var allCommand = "--all";
 
  // debugLog(cmd, ":", match);
  // debugLog(typeof cmd, ":", typeof match);

  debugLog(cmd + ":" + readCmd);
  if(cmd === readCmd){
    debugLog(cmd + ":" + readCmd);
    var tgtFile  = SpreadsheetApp.getActiveSpreadsheet();
    var tgtSheet = tgtFile.getActiveSheet();
//    var tgtSheet = tgtFile.getSheetByName("TicketsInfo");
    
    var startrow = 1;
    var startcol = 1;
    var lastrow = tgtSheet.getLastRow();
    var lastcol = tgtSheet.getLastColumn();
    
    var sheetdata = tgtSheet.getSheetValues(startrow, startcol, lastrow, lastcol);
    
    var textWidths = [6, 14, 10, 12, 12, 18, 42];
    
    msgs = [];
    rowdata = "";
    var tStat;
    var isToday;
    var compText = "Completed";
    var allFlg = false;

    if(opt === allCommand)
      allFlg = true;

    // i = 行
    // j = 列
    for (var i = 0 ; i < lastrow ; i++ ){
      tStat = "";
      isToday = "";
      for (var j = 0 ; j < lastcol ; j++ ){
        // なんらかの理由で余計な列が増えていても7個目で打ち切る
        if (j == 7) break;

        // 当該セルのテキスト取得
        item  = sheetdata[i][j];
        
        // 2列目ならステータスが格納されている。(Z/TH Issued - Completed)
        if(j == 1){
          tStat = item;
        }

        // 一行目はそのまま出力
        // 二行目以降は適宜評価を行う
        if (i != 0){
          // チケット日付
          if (j == 5){
            // 当日のチケットか確認
            todays0000 = getTodays0000().getTime();
            ticketTime = item.getTime();
            // debugLog(todays0000 + ":" + ticketTime);
            if(todays0000 < ticketTime)
              isToday = true;
            // debugLog(item + ":" + typeof item);
            item = Utilities.formatDate(item, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm');
          }

          // Summaryは40字で切る
          if (j == 6){
            item = item.slice(0, 40);
          }
        }

        item  = item.toString();
        item  = paddingright(item, " ", textWidths[j]);

        rowdata += item;
      }
      // debugLog(isToday + ":" + tStat);

      // 全出力なら全チケット情報出力
      if(allFlg) {
        msgs.push(rowdata);
      }
      // 当日チケットはステータスに関わらず出力
      // 朔日以前のチケットは完了済みなら出力しない
      else {
        if(isToday) {
          msgs.push(rowdata);
        }
        else {
          if(tStat !== compText) {
            msgs.push(rowdata);
          }
        }
      }
      rowdata = "";
    }
    // for (var i = 0 ; i < msgs.length ; i++ ){
    //   debugLog(msgs[i]);
    // }
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
}
