const {send, sendError} = require('micro');
const microCors = require('micro-cors');
const moment = require('moment');
const parse = require('urlencoded-body-parser');
const namesToUsers = require('./names-to-users');
const userFacts = require('./user-facts');

const cors = microCors({allowMethods: ['GET', 'POST']});

module.exports = cors(handleRequest);

function mediaTeamHandler(req, res) {
  let mediateamRes =
    {
      text: 'Joana\nLukas\nMaša\nSolène\nYulia',
      response_type: 'in_channel'
    };

  send(res, 200, mediateamRes);
}

function daysLeftHandler(req, res) {
  let now = new Date();
  let troDate = new Date('2017-4-19 00:00:00 +0100');
  let daysLeft = moment(troDate).diff(now, 'days');

  if (daysLeft < 0) {
    daysLeft = 0;
  }

  let daysText = `There are *${daysLeft} days* until TRØ17 is on!`;

  let whenRes =
    {
      text: daysText,
      response_type: 'in_channel'
    };

  send(res, 200, whenRes);
}

function helpHandler(req, res) {
  let helpRes =
    {
      text:
        'I am here to help you out, ' +
        'here are the commands I accept:\n' +
        '`/trobot help`\n' +
        '`/trobot when`\n' +
        '`/trobot mediateam`\n',
      response_type: 'ephemeral'
    };

  send(res, 200, helpRes);
}

function unknownMessageHandler(req, res, text) {
  let msgRes =
    {
      text: `I'm sorry, I could not process message ${text}`,
      response_type: 'ephemeral'
    };

  send(res, 200, msgRes);
}

function whoStartHandler(req, res) {
  let {id, question} = generateGame();

  let startRes =
    {
      text: `Fact game started, and will be active for 30 minutes,
            please use who answer ${id} name when responding.\n
            *Question:* ${question}`,
      response_type: 'in_channel'
    };
  // "The options are..."

  send(res, 200, startRes);
}

function generateGame() {
  // TODO: some kind of "freshness"
  // read facts, pick one and save id, answer, username, in levelDB
  // return id, question
  // "The options are..."
}

function whoAnswerHandler(req, res, message) {
  // TODO: Some kind of point system?
  // destructure username, id, answer
  let {username, id, answer} = message;
  let {isFound, isCorrect} = answerGame(id, answer);

  if (isFound) {
    if (isCorrect) {
      let answerUsername = namesToUsers[answer];
      let answerRes =
        {
          text: `Congrats ${username}! ${answerUsername} is indeed the person we are looking for`,
          response_type: 'in_channel'
        };
      send(res, 200, answerRes);
    } else {
      let answerRes =
        {
          text: 'Sorry, that is not the correct response :(',
          response_type: 'in_channel'
        };
      send(res, 200, answerRes);
    }
  } else {
    let answerRes =
      {
        text: 'I couldn not find the game you are looking for. Maybe it has expired?',
        response_type: 'ephemeral'
      };
    send(res, 200, answerRes);
  }
}

function answerGame(id, answer) {
  // check levelDB for id, answer
  // send found or not
  // send success or not
}

async function handleRequest(req, res) {
  const message = await parse(req);

  if (message.token !== process.env.SLACK_TOKEN) {
    send(res, 401, 'Unauthorized');
  }

  try {
    switch (message.text) {
      case 'mediateam':
        mediaTeamHandler(req, res);
        break;

      case 'when':
        daysLeftHandler(req, res);
        break;

      case 'who start':
        whoStartHandler(req, res);
        break;

      case 'who answer':
        whoAnswerHandler(req, res, message);
        break;

      case 'help':
        helpHandler(req, res);
        break;

      case '':
        helpHandler(req, res);
        break;

      default:
        unknownMessageHandler(req, res, message.text);
        break;
    }
  } catch (err) {
    sendError(req, res, err);
  }
}
