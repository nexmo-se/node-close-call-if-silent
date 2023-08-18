require('dotenv').config();
const {Vonage} = require("@vonage/server-sdk");
const { tokenGenerate } = require('@vonage/jwt');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const app = express();
const WebSocketServer = require('ws').Server;
const server = require('http').createServer();
const fs = require('fs');
const voice_handler = require('./voice-handler');
var request = require('request');


const port = process.env.PORT;
const url = process.env.URL;
const Vonage_API_KEY = process.env.API_KEY;
const Vonage_APPLICATION_ID = process.env.APPLICATION_ID;
const Vonage_PRIVATE_KEY = process.env.PRIVATE_KEY;
const Vonage_LVN = process.env.VONAGE_LVN;
const privateKey = fs.readFileSync(Vonage_PRIVATE_KEY);
const WSAPP = "AppMonitor"
var wss = new WebSocketServer({ server: server });

//seconds until call is hangup when silent
SILENCE_TIMEOUT = 2

const vonage =  new Vonage ({
  apiKey: Vonage_API_KEY,
  applicationId: Vonage_APPLICATION_ID,
  privateKey: Vonage_PRIVATE_KEY
}, {debug: true, apiHost: "https://api-us-1.nexmo.com"});


//ACL for User
const aclPaths = {
  "paths": {
    "/*/rtc/**": {},
    "/*/users/**": {},
    "/*/conversations/**": {},
    "/*/sessions/**": {},
    "/*/devices/**": {},
    "/*/image/**": {},
    "/*/media/**": {},
    "/*/knocking/**": {},
    "/*/legs/**": {}
  }
}

//generates a user token
const user_token = () => {return tokenGenerate(Vonage_APPLICATION_ID, privateKey, {
  //expire in 24 hours
  exp: Math.round(new Date().getTime()/1000)+86400,
  sub: "sfcaller",
  acl: aclPaths,
})};

const hangup = async (conv_uuid) =>{
  console.log("Hanging UP Conversation with id:",conv_uuid)
  var options = {
    'method': 'DELETE',
    'url': 'https://api.nexmo.com/v0.3/conversations/'+conv_uuid,
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': await vonage.credentials.createBearerHeader()
    }
  
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use("/node_modules", express.static(path.join(__dirname, 'node_modules')))

wss.on('connection', function connection(ws) {  
  voice_handler.close_when_silent(ws, SILENCE_TIMEOUT )
  ws.send('something');

  ws.on('close', (data)=>{
    console.log("close")
    console.log(data)
  }
  )
});


const ncco = (to) => {
  return[
    {
      "action": "talk",
      "text": "Please wait while we connect you"
    },
    {
      "action": "connect",
      "timeout": "45",
      "from": Vonage_LVN,
      "eventUrl": [url+"/webhooks/call-event"],
      "endpoint": [
        {
          "type": "phone",
          "number": to
        }
      ]
    },
    {
      "action": "talk",
      "text": "You are now in a call."
    },
    {
      "action": "connect",
      "from": WSAPP,
      "eventUrl": [url+"/webhooks/ws-event"],
      "endpoint": [
        {
          "type": "websocket",
          "uri": url.replace("https","wss"),
          "content-type": "audio/l16;rate=16000"      
        }
      ],
    }
  ]
};

app.get('/', (req, res) => {
  res.json(200);
});

app.get('/dialer', (req, res) => {
  res.render('client.ejs', {
    user_token: user_token()
  });
});

app.get('/webhooks/answer', (req, res) => {
  console.log('NCCO request:');
  console.log(`  - callee: ${req.query.to}`);
  console.log('---');
  return res.json(ncco(req.query.to))
});

app.post('/webhooks/call-event', async (req, res) => {
  console.log("CALL EVENT", req.body)
  var callevent = req.body
  if (callevent.direction == "outbound" && callevent.status == "disconnected"
  && callevent.from == WSAPP){
    console.log("Hanging UP")
    hangup(callevent.conversation_uuid)    
    return
  }
});

app.post('/webhooks/ws-event', async (req, res) => {
  console.log("WEB SOCKET EVENT", req.body)
});

server.on('request', app)

server.listen(port, () => {
  console.log(`Hang up on Silence Demo ${port}`)
  console.log(``)
});


