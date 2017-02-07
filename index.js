const { send, sendError, json } = require('micro');
const microCors = require('micro-cors');
const moment = require('moment');
const url = require('url');

const cors = microCors({ allowMethods: ['GET', 'POST'] });

module.exports = cors(handleRequest);

function mediaTeamHandler(req, res) {
  let mediateamRes =
    {
      text: "Masa\nLukas\nJoana\nSolene\nYulia",
      response_type: "in_channel"
    }

  send(res, 200, mediateamRes);
}

function daysLeftHandler(req, res){
  let now = new Date();
  let troDate = new Date('2017-4-19 00:00:00 +0100');
  let daysLeft = moment(troDate).diff(now, 'days');

  if (daysLeft < 0) {
    daysLeft = 0
  }

  let daysText = `There are *${daysLeft} days* until TRØ17 is on!`

  let whenRes =
    {
      text: daysText,
      response_type: "in_channel"
    }

  send(res, 200, whenRes);
}

function unknownMessageHandler(req, res, text){
  let msgRes =
    {
      text: `I'm sorry, I could not process message ${text}`,
      response_type: "ephemeral"
    }

  send(res, 200, msgRes);
}

async function handleRequest(req, res) {
  const message = await json(req)

  if (message.token !== process.env.SLACK_TOKEN) {
    send(res, 401, "Unauthorized");
  }

  try {
    switch (message.text) {
      case 'mediateam':
        mediaTeamHandler(req, res);

      case 'when':
        daysLeftHandler(req, res);

      default:
        unknownMessageHandler(req, res, message.text);
    }
  } catch (error) {
    sendError(req, res, error);
  }
}
