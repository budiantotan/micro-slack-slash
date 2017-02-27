const level = require('level');
const toPromise = require('then-levelup');
const {send} = require('micro');
const shortid = require('shortid');

// const namesToUsers = require('./names-to-users');
const questions = require('./questions');

const db = toPromise(level('games.db', {
  valueEncoding: 'json'
}));

async function whoStartHandler(req, res) {
  let {id, question} = await generateGame();

  let startRes =
    {
      text: `Fact game started, and will be active for 30 minutes,
      please use \`trobot who answer ${id} [name]\` when responding.
      *Question:* ${question},
      *Game id:* ${id}`,
      response_type: 'in_channel'
    };

  send(res, 200, startRes);
}

async function generateGame() {
  // TODO: some kind of "freshness"?
  // TODO: Expiration

  // read facts, pick one and save id, answer, username, in levelDB
  let ceil = questions.length;
  let index = Math.floor(Math.random() * ceil);

  let id = shortid.generate();
  let {question, answer} = questions[index];

  let game =
    {
      question: question,
      answer: answer
    };

  // Persist to DB
  await db.put(id, game);

  return {id, question};
}

async function whoAnswerHandler(req, res, {id, answer}, username) {
  // TODO: Some kind of point system?
  if (!username) {
    username = 'friend';
  }

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

async function whoGameRouter(req, res, message) {
  // "Who" game routing
  const regex = /who (answer|start$) ?((\d*) (\w*))? ?/g;
  let matches;

  if ((matches = regex.exec(message.text)) !== null) {
    switch (matches[1]) {
      case 'start':
        await whoStartHandler(req, res);
        break;

      case 'answer':
        if (matches[3] && matches[4]) {
          let id = matches[3];
          let answer = matches[4];
          let username = message.user_name;
          await whoAnswerHandler(req, res, {id, answer}, username);
        }
        break;

      default:
        break;
    }
  }
}

module.exports = {whoGameRouter, whoStartHandler, whoAnswerHandler, generateGame, answerGame};
