import 'dotenv/config' //引用env
import linebot from 'linebot' //引用Linebot
import commandUsd from './commands/Usd.js'
import commandFood from './commands/food.js'
import commnadQr from './commands/qr.js'

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
})

bot.on('message', (event) => {
  if (event.message.type === 'text') {
    if (event.message.text === 'usd') {
      commandUsd(event)
    } else if (event.message.text === 'qr') {
      commnadQr(event)
    }
  } else if (event.message.type === 'location') {
    commandFood(event)
  }
})

bot.on('postback', async (event) => {
  console.log(event)
  await event.reply(event.postback.data)
})

bot.listen('/', process.env.PORT || 3000, () => {
  console.log('機器人啟動')
})
