// import sendMsgToFeishu from "./bundle";
const sendMsgToFeishu = require('../dist/bundle')

sendMsgToFeishu({
  token: '4d4b3813-c03c-4bcb-a963-2ca5ff9529eb',
  content: 'vconsole test'
})