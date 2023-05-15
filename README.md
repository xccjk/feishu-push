# 飞书群消息推送

## 使用方式

```javascript
yarn add feishu-push
```

```javascript
import sendMsgToFeishu from 'feishu-push';

sendMsgToFeishu({
  msgType: 'text', // 消息推送类型，支持text和post，默认text
  token: 'xxx',    // 飞书群webhook token，例子：https://open.feishu.cn/open-apis/bot/v2/hook/4d4b3813-c03c-4bcb-a963-2ca5ff9529eb
  /*
    type: text
    content为包含关键字的推送信息

    type: post
    content = {
      "title": "项目更新通知",
      "content": [
        [{
            "tag": "text",
            "text": "xxx"
          },
          {
            "tag": "a",
            "text": "请查看",
            "href": "xxx"
          },
          {
            "tag": "at",
            "user_id": "xxx"
          }
        ]
      ]
    }
  */
  content: 'xxx'
})
```

## shell脚本实现飞书群通知

[shell实现飞书群通知](https://github.com/xccjk/feishu-push/issues/1)
