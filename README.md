# 飞书群消息推送

## 使用方式

```javascript
yarn add feishu-push
```

```javascript
import sendMsgToFeishu from 'feishu-push';

// 飞书群webhook token，例子：https://open.feishu.cn/open-apis/bot/v2/hook/4d4b3813-c03c-4bcb-a963-2ca5ff9529eb

// text
sendMsgToFeishu({
  msgType: 'text', // 消息推送类型，支持text和post，默认text
  token: 'xxx',
  content: 'content为包含关键字的推送信息'   
  /*
    type: text
    

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
})


// post
sendMsgToFeishu({
  msgType: 'post', // 消息推送类型，支持text和post，默认text
  token: 'xxx',
  content: {
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
})
```
