const { send, sendError, json } = require('micro');
const microCors = require('micro-cors');
const url = require('url');

const cors = microCors({ allowMethods: ['GET', 'POST'] });

module.exports = cors(handleRequest);

async function handleRequest(req, res) {
  const data = await json(req)

  try {
    switch (data.text) {
      case 'mediateam':
        let mediateamRes =
            {
              text: "Masa\nLukas\nJoana\nSolene\nYulia",
              response_type: "in_channel"
            }
        send(res, 200, mediateamRes);

      case 'when':
        let currentDate = Date.now()
        let troDate = new Date(2017, 4, 19)
        let daysLeft = ...

        if daysLeft < 0 {
          daysLeft = 0
        }

        let daysText = `There are *${daysLeft} days* until TRØ17 is on!`

        let whenRes =
            {
              text: daysText
              response_type: "in_channel"
            }
        send(res, 200, whenRes);

      default:
        send(res, 404, "Not found :(");
        break;
    }
  } catch (error) {
    sendError(req, res, error);
  }
}
