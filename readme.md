# NAMEBOT

## Requirements

- npm 16

## Instructions

### OAUth2 Link

1. Register the bot by visiting this URL:

https://discord.com/api/oauth2/authorize?client_id=921269713345069077&permissions=134219776&scope=applications.commands%20bot

2. Give the bot a role ranked higher than all other roles.

### Environment Variables

use a .env file:

| Variable               | Description                                |
| ---------------------- | ------------------------------------------ |
| `DISCORD_NAME_CHANNEL` | channel name to post notifications to      |
| `DISCORD_HIDDEN`       | set to something to hide responses         |
| `DISCORD_TOKEN`        | bot secret                                 |
| `DISCORD_GLOBAL`       | set to something to update global commands |
| `DISCORD_GUILD_ID`     | set to something to update guild commands  |
| `HONEYCOMB_API_KEY`    | for tracing                                |

### Maintenance

Use pm2 per [this guide](https://discordjs.guide/improving-dev-environment/pm2.html#setting-up-booting-with-your-system).

## Deploying

Connect Docker to AWS ECR
```bash
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $DOCKER_REGISTRY
```

See standard push commands in ECR

