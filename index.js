const https = require('https')
const fs = require('fs')
const path = require('path')
const {
  exec
} = require('child_process')

const requestApiPath = `https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?host_uid=`
const {
  eoeHostUid,
  liveSchedule
} = require('./config.json')

// 获取动态信息
const requestStatus = () => new Promise(resolve => {
  const requestPath = `${requestApiPath}${eoeHostUid}`

  https.get(requestPath, response => {
    const data = []
    response.on('data', d => data.push(d))
    response.on('end', () => {
      // request finish, get result
      const resp = JSON.parse(data.join(''))
      resolve(resp)
    })
  })
})

// 分析出直播动态
const analyze = (requestResult) => {
  const { cards } = requestResult.data

  if (cards && cards.length) {
    // 找到置顶动态 没接口文档，暂时通过匹配关键字的方式找
    const findKeyword = '本周直播安排'
    const liveScheduleDynamicCard = cards.find(cardData => cardData.card.includes(findKeyword))
    if (liveScheduleDynamicCard) {
      // 找到了
      const {
        item, user
      } = JSON.parse(liveScheduleDynamicCard.card)
      return {
        dynamic: item.description,
        dynamicPic: item.pictures
      }
      console.log(item)
    }
    console.log(liveScheduleDynamicCard)
  }
  return undefined
}

// 将直播动态写入本地文件
const setData = (schdeuleData) => {
  const schduleFile = path.resolve(__dirname, liveSchedule)
  if (fs.existsSync(schduleFile)) {
    fs.unlinkSync(schduleFile)
  }
  if (schdeuleData) {
    fs.writeFileSync(schduleFile, `var liveSchdule = ${JSON.stringify(schdeuleData)}`)
  } else {
    throw '未获取到直播日程安排'
  }
}

// 打开展示页面
const showDynamic = () => {
  const viewerPathPath = path.resolve(__dirname, './renderHtml/viewer.html')
  const cmd = `start ${viewerPathPath}`

  exec(cmd)
}

const run = () => {
  requestStatus()
    .then(analyze)
    .then(setData)
    .then(showDynamic)
    .catch(err => { throw err })
}

run()