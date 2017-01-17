/* eslint-disable no-console */
'use strict';

const express = require('express');
const path = require('path');
const app = express();

let requireUncached = function(mockFile){
  // delete cached data, force the server to reload the json data from fs every time
  delete require.cache[require.resolve(mockFile)];
  return require(mockFile);
};

let handleRequest = function(basePatch, requestPath, httpVerb, res) {
  let filePath = path.join(__dirname, basePatch, requestPath, `${httpVerb}.json`);
  let fileData;

  try {
    fileData = requireUncached(filePath);
    console.warn(`"${httpVerb} ${filePath}" - ${fileData.statusCode}`);

    res.status(fileData.statusCode);
    res.send(fileData.content);
  } catch (err){
    console.warn(`"${httpVerb} ${filePath}" - 404`);

    res.status(404);
    res.send("");
  }
};

app.get('/api/ext/*', function(req, res){
  handleRequest("api_mocks", req.params["0"], "GET", res);
});

app.post('/api/ext/*', function(req, res){
  handleRequest("api_mocks", req.params["0"], "GET", res);
});

app.listen(MOCK_SERVER_PORT, function(){
  console.warn(`mock service listening on http://localhost:8001`);
});

