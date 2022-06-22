require("dotenv").config();
import request from "request";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_INBOX = 263902037430900;
const MAIN_APP = 3167235143491987;

let getHomePage = (req, res) => {
  return res.send("hello");
};

let getWebhook = (req, res) => {
  // Your verify token. Should be a random string.

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

let postWebhook = (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    
    
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
    
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // if message is text => pass thread to agent support
    // pass_thread_control_to_page_inbox(sender_psid);
    if(received_message.text == "human"){
      pass_thread_control_to_page_inbox(sender_psid);
      response = {
        "text": `You are redirecting to agent support! Type "bot" to chat with bot!`
      }
    }else if(received_message.text == "bot"){
      take_thread_control(MAIN_APP, sender_psid);
      response = {
        "text": `You are redirecting to bot chat! Type "human" to get support from human!`
      }
    }else {
      response = {
        "text": `You sent the message: "${received_message.text}". Now send me an image hehe!`
      }
    }
    
  } else if (received_message.attachments) {
    // if message is attachment => pass thread to botchat
    take_thread_control(MAIN_APP, sender_psid);

    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              },
              {
                "type": "postback",
                "title": "Yesn't",
                "payload": "yesn't",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Send the response message
  callSendAPI(sender_psid, response);     
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  } else if (payload == 'yesn\'t'){
    response = { "attachment": {
      "type": "template",
      "payload": {
         "template_type": "media",
         "elements": [
            {
               "media_type": "image",
               "url": "https://www.facebook.com/photo.php?fbid=1252301965539799"
            }
         ]
      }
    }     }
  }else if(payload === 'CARE_HELP'){
    response = { "attachment": {
      "type": "template",
      "payload": {
         "template_type": "media",
         "elements": [
            {
               "media_type": "image",
               "url": "https://www.facebook.com/photo.php?fbid=1701053246931629"
            }
         ]
      }
    }     }
  }
  else if(payload === 'CURATION'){
    response = { "attachment": {
      "type":"template",
      "payload": {
        "template_type": "media",
        "elements": [
           {
              "media_type": "video",
              "url": "https://business.facebook.com/CrushSG/videos/390916612995177"
           }
        ]
     }
    }     }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

// pass thread control to another app
function pass_thread_control(app_id, sender_psid) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    target_app_id: app_id,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.12/me/pass_thread_control",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("Pass thread to ", app_id , " successfuly!");
      } else {
        console.error("Unable to pass thread: " + err);
      }
    }
  );
}

// Take thread control from another app
function take_thread_control(sender_psid) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.12/me/take_thread_control",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("Take thread back successfuly!");
      } else {
        console.error("Unable to take thread:" + err);
      }
    }
  );
}



function pass_thread_control_to_page_inbox(sender_psid)
{
  pass_thread_control(PAGE_INBOX, sender_psid);
}



module.exports = {
  getHomePage: getHomePage,
  getWebhook: getWebhook,
  postWebhook: postWebhook,
};
