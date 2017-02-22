const {send, sendError} = require('micro');
const microCors = require('micro-cors');
const moment = require('moment');
const parse = require('urlencoded-body-parser');

const level = require('level');
const toPromise = require('then-levelup');
const namesToUsers = require('./names-to-users');
const userFacts = require('./user-facts');

const cors = microCors({allowMethods: ['GET', 'POST']});

const db = toPromise(level('games.db', {
  valueEncoding: 'json'
}));

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
      text: `I'm sorry, I could not process message \`${text}\``,
      response_type: 'ephemeral'
    };

  send(res, 200, msgRes);
}

async function whoStartHandler(req, res) {
  let {id, question} = await generateGame();

  let startRes =
    {
      text: `Fact game started, and will be active for 30 minutes,
            please use \`who answer ${id} [name]\` when responding.
            *Question:* ${question},
            *Game id:* ${id}`,
      response_type: 'in_channel'
    };
  // "The options are..."

  send(res, 200, startRes);
}

async function generateGame() {
  // TODO: some kind of "freshness"
  // TODO: Expiration
  // TODO: UUID

  // read facts, pick one and save id, answer, username, in levelDB
  // hardcoded for now
  let id = 123;
  let question = 'Who is a cool person?';
  let answer = 'Fotis';

  let game =
    {
      question: question,
      answer: answer
    };

  // Persist to DB
  await db.put(id, game);

  return {id, question};
}

async function whoAnswerHandler(req, res, {id, answer}) {
  // TODO: Some kind of point system?
  // TODO: get username
  let username = 'friend';
  let {isFound, isCorrect} = await answerGame(id, answer);

  if (isFound) {
    if (isCorrect) {
      // let answerUsername = namesToUsers[answer];
      let answerUsername = answer;
      let answerRes =
        {
          text: `Congrats, ${username}! ${answerUsername} is indeed the person we are looking for :star: :clap:`,
          response_type: 'in_channel'
        };
      send(res, 200, answerRes);
    } else {
      let answerRes =
        {
          text: `Sorry ${username}, that is not the correct response :(`,
          response_type: 'in_channel'
        };
      send(res, 200, answerRes);
    }
  } else {
    let answerRes =
      {
        text: 'I could not find the game you are looking for. Maybe it has expired?',
        response_type: 'ephemeral'
      };
    send(res, 200, answerRes);
  }
}

async function answerGame(id, answer) {
  // check levelDB for id, answer
  let isFound = false;
  let isCorrect = false;
  let correctAnswer = '';

  try {
    let ans = await db.get(id);
    correctAnswer = ans.answer;
    isFound = true;
  } catch (err) {
    if (err.notFound) {
      isFound = false;
    }
  }

  if (answer === correctAnswer) {
    isCorrect = true;
  }

  return {isFound, isCorrect};
}

async function handleRequest(req, res) {
  const message = await parse(req);

  if (message.token !== process.env.SLACK_TOKEN) {
    send(res, 401, 'Unauthorized');
  }

  // "Who" game routing
  const regex = /who (answer|start$) ?((\d*) (\w*))? ?/g;
  let matches;

  if ((matches = regex.exec(message.text)) !== null) {
    try {
      switch (matches[1]) {
        case 'start':
          await whoStartHandler(req, res);
          break;

        case 'answer':
          if (matches[3] && matches[4]) {
            let id = matches[3];
            let answer = matches[4];
            await whoAnswerHandler(req, res, {id, answer});
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.log(matches);
      sendError(req, res, err);
    }
  }

  // Other routing
  try {
    switch (message.text) {
      case 'mediateam':
        mediaTeamHandler(req, res);
        break;

      case 'when':
        daysLeftHandler(req, res);
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
