# **Conage Close Call if Silent**

This application shows how to use a Websocket endpoint to detect seconds of silence and end the call.

The part that handles the detection of silence is in `voice-handler.js`.

This uses an algorithm called `Root Mean Square` that detects volume levels. If the the call is silent for X seconds, the websocket endpoint will close.

The `call-event` endpoint will then detect that the websocket has closed and delete the conversation, ending the call for all.

# **Deployment Guide**

## **1. Install dependencies:**

    npm install

## **2. Populate “.env”**
Copy `.env.samp` file as `.env` and put in the values for the following:
 
 

 - **API_KEY**
	- Your Vonage API KEY
- **API_SECRET**
	- Your Vonage API Secret
- **APPLICATION_ID**
	- Your Vonage Application ID
- **PRIVATE_KEY**
	- Path to you private.key
- **PORT**
	- port where we run this service
- **VONAGE_LVN**
	- Your Vonage Number
- **URL**
	- The public accessible URL this application will run
- **HANGUP_TIMEOUT**
  - Number of Seconds of Silence until the call hangs up

## 3. Run the code and make a call

- node app.js
- Go to `URL/dialer` to make a call

