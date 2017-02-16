/* eslint-disable no-console */
'use strict';

const express = require('express');
const request = require('request');
const path = require('path');
const app = express();

const mockServerPort = 8001;
const mockedResources = ["ssh-keys","dc","clusters"];
const proxyUrl = "https://dev.kubermatic.io";

let requireUncached = function(mockFile){
  // delete cached data, force the server to reload the json data from fs every time
  delete require.cache[require.resolve(mockFile)];
  return require(mockFile);
};

let handleRequestInternal = function (res, fileData) {
  let contentType = "text/json";
  let body = fileData.responseBody;

  if (fileData.spec.contentType === "text/plain") {
    contentType = "text/plain";
    body = fileData.responseBody.plain;
  }

  res.status(fileData.spec.statusCode);
  res.set('Content-Type', contentType);
  res.send(body);
};

let handleRequest = function(basePatch, requestPath, httpVerb, res) {
  let filePath = path.join(__dirname, basePatch, requestPath, `${httpVerb}.json`);
  let fileData;

  try {
    fileData = requireUncached(filePath);
    console.warn(`Mocking request: "${httpVerb} ${filePath}" - ${fileData.spec.statusCode}`);
    let responseTimeMs = 200;

    if (fileData.spec.responseTimeMs) {
      responseTimeMs = fileData.spec.responseTimeMs;
    }

    setTimeout(function() {
      handleRequestInternal(res, fileData);
    }, responseTimeMs);
  } catch (err){
    console.warn(`Mocking request: "${httpVerb} ${filePath}" - 404`);

    res.status(404);
    res.set('Content-Type', 'text/plain');
    res.send("");
  }
};

let proxyRequest = function (path, req, res) {
  let uri = `${proxyUrl}/api/v1/${path}`;
  console.warn(`Proxying request: "${uri}"`);
  req.pipe(request(uri)).pipe(res);
};

let isMockedResource = function(path) {
  return (mockedResources.indexOf(path.split("/")[0]) != -1);
};

let dispatchRequest = function (req, res, httpVerb) {
  let path = req.params["0"];

  if (isMockedResource(path)) {
    handleRequest("api_mocks", path, httpVerb, res);
  } else {
    proxyRequest(path, req, res);
  }
};


app.get('/api/v1/*', function(req, res){
  dispatchRequest(req, res, "GET");
});

app.post('/api/v1/*', function(req, res){
  dispatchRequest(req, res, "POST");
});

app.delete('/api/v1/*', function(req, res){
  dispatchRequest(req, res, "DELETE");
});

app.listen(mockServerPort, function(){
  console.warn(`Mock server listening on http://localhost:${mockServerPort}`);
});

