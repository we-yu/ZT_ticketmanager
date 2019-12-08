// Global
// Project properties handler get
var PROPERTIES_HANDLE = PropertiesService.getScriptProperties().getProperties();
// Unique key for log-output file
var logFileKey = PROPERTIES_HANDLE.LOG_FILE_KEY;
// Handler for log file
var logFile    = SpreadsheetApp.openById(logFileKey);
// Handler for log sheet (in log file)
var logSheet   = logFile.getActiveSheet();

// Add 1 line
// Add more 1 line

// Function for output text as log file.
function debugLog(logText)
{
  // If argument is empty, clear all log text and finish function.
  if (!logText)
  {
    logSheet.clear();
    logSheet.getRange(1, 1).setValue("Time");
    logSheet.getRange(1, 2).setValue("Message");
    return;
  }

  // Output line is (Next of Bottomline) 
  var writeRow = logSheet.getDataRange().getLastRow() + 1
  
  // Create log time
  var nowDate = new Date();
  var nowDateText = nowDate.getFullYear() + "/" + (nowDate.getMonth() + 1) + "/" + nowDate.getDate() + " " + nowDate.getHours() + ":" + nowDate.getMinutes() + ":" + nowDate.getSeconds();

  // Export time and target text
  logSheet.getRange(writeRow, 1).setValue(nowDateText);
  logSheet.getRange(writeRow, 2).setValue(logText);
}

