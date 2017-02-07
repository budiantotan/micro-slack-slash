# About
A simple Slack slash command integration that replies to various messages.
It accepts POST requests in the `slash command` format, verifies the key & domain, and looks for handlers corresponding to the `text` field, dispatching as appropriate. Otherwise, it throws an error.

Uses `async-await` and the handy [micro framework](https://github.com/zeit/micro) to provide a minimal interface.
Ideal for deploying to [now.sh](https://now.sh).

Originally designed for Trondheim & Røros, it is easy to extend and customise to your liking.
There is no routing to speak of, apart from handling each `data.text` differently for each command.

# Development
- You should have `node` installed; the 6.9 LTS is known to work well
- Install dependencies with `yarn` or `npm install`
- Then `yarn run start` or `npm start`, and navigate to `localhost:3000`
- Send POST requests to the root; see the format below

# Deployment
The service is currently deployed using [now.sh](https://now.sh), which means you just run `now` at the project root.

Otherwise, the steps would be roughly:
- Install `node`
- Copy your code to the production server
- Set `NODE_ENV=production`
- Proxy Port 80 to the server port
- You might want to look into a process manager, or run the server as a service

# Slack setup
- Go to your team's `add integrations`
- Select `Slash Commands`
- Customise your `command`; users will type `/mycommandname message`
- Add the `URL` of your public-facing service
- Set `method` to POST
- Add the `token` that you get to the `index.js` `KEY` constant
- Customise anything else to your liking

# Usage / Slash Command Format
Slack describes it as:
```
token=xMbiJZV2dFxNSSWvINE5SY9Z
team_id=T0001
team_domain=example
channel_id=C2147483705
channel_name=test
user_id=U2147483697
user_name=Steve
command=/weather
text=94070
response_url=https://hooks.slack.com/commands/1234/5678
```

Of these, `text` is important to disambiguate which handler to use, and `token` to gate access.
The other fields are also available under `data` and you can combine them however you wish.
`Response_url` is a bit more interesting; [read the Slack documentation to learn more about it](https://api.slack.com/slash-commands).

# References
Slack slash-command docs:
[https://api.slack.com/slash-commands](https://api.slack.com/slash-commands)

Zeit micro:
[https://github.com/zeit/micro](https://github.com/zeit/micro)
