/* eslint-disable no-console */
'use strict';

const express = require('express');
const request = require('request');
const path = require('path');
const app = express();

const mockServerPort = 8001;
const mockedResources = ["sshkeys"];
const proxyUrl = "https://beta.kubermatic.io";

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
    console.warn(`Mocking request: "${httpVerb} ${filePath}" - ${fileData.statusCode}`);

    res.status(fileData.statusCode);
    res.send(fileData.content);
  } catch (err){
    console.warn(`Mocking request: "${httpVerb} ${filePath}" - 404`);

    res.status(404);
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

app.get('/api/v1/*', function(req, res){
  let path = req.params["0"];

  if (isMockedResource(path)) {
    handleRequest("api_mocks", path, "GET", res);
  } else {
    proxyRequest(path, req, res);
  }
});

app.post('/api/v1/*', function(req, res){
  let path = req.params["0"];

  if (isMockedResource(path)) {
    handleRequest("api_mocks", path, "POST", res);
  } else {
    proxyRequest(path, req, res);
  }
});

app.listen(mockServerPort, function(){
  console.warn(`Mock server listening on http://localhost:${mockServerPort}`);
});

