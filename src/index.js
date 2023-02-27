import axios from 'axios';

const sendMsgToFeishu = async ({ msgType = 'text', token = '', content }) => {
  let params = {};
  if (msgType === 'text') {
    params = {
      msg_type: msgType,
      content: {
        text: content || ''
      }
    }
  }
  if (msgType === 'post') {
    params = {
      msg_type: msgType,
      content: {
        post: {
          zh_cn: content || {}
        }
      }
    }
  }

  return await axios.post(
    `https://open.feishu.cn/open-apis/bot/v2/hook/${token}`,
    params,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

export default sendMsgToFeishu;