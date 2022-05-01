import toast from '../../../utils/toast'
import util from '../../../utils/util';

const gloData = getApp().gloData;
const db = wx.cloud.database()
var timer


Page({

  /**
   * 页面的初始数据
   */
  data: {
    tableBarH: gloData.tableBarH,
    loadWidth: 0, //进度条
    chooseRangeList: {
      itemType: ['卡片(校园卡、银行卡等)', '电子用品(耳机、U盘等)', '生活常用(钥匙、钱包等)', '学习常用(笔袋、课本等)', '其他', ], //物品类型
      placeType: ['教学场所(包括游泳馆、操场等)', '食堂(包括小吃街、超市等)', '寝室', '其他', ], //拾取地点
      layType: ['移交托管(食堂前台、教学楼保安等)', '原地存放(附近掩埋、遮盖等)', '自身保管，联系取回（不建议）', '其他', ], //放置地点
    }, //选择数据源
    showTipsName: {
      itemType: {
        '卡片(校园卡、银行卡等)': {
          inputTitle: '卡面信息',
          inputTips: '建议输入姓名、学院等相关信息。'
        },
        '电子用品(耳机、U盘等)': {
          inputTitle: '描述信息',
          inputTips: '建议从型号名称、使用痕迹方面描述。'
        },
        '生活常用(钥匙、钱包等)': {
          inputTitle: '描述信息',
          inputTips: '建议从钥匙数量、装饰物品方面描述。'
        },
        '学习常用(笔袋、课本等)': {
          inputTitle: '描述信息',
          inputTips: '建议从物品名称、使用痕迹方面描述。'
        },
        '其他': {
          inputTitle: '描述信息',
          inputTips: '建议从物品名称、特殊标记、使用痕迹方面描述。'
        },
      },
      placeType: {
        '教学场所(包括游泳馆、操场等)': {
          inputTitle: '拾取地点',
          inputTips: '请简要概括拾取位置，用阿拉伯数字描述。如“橘园1舍”，“25教302”，“32教4楼走廊”。'
        },
        '食堂(包括小吃街、超市等)': {
          inputTitle: '拾取地点',
          inputTips: '请简要概括拾取位置。如“楠园1食堂”，“杏园食堂3楼”。'
        },
        '寝室': {
          inputTitle: '拾取地点',
          inputTips: '请简要概括拾取位置。如“梅园3舍1楼”，“橘园1舍门口”。'
        },
        '其他': {
          inputTitle: '拾取地点',
          inputTips: '请简要概括拾取位置。如“2号门通往4运的小路上”，“8教候车牌附近”。'
        },
      },
      layType: {
        '移交托管(食堂前台、教学楼保安等)': {
          inputTitle: '托管地点',
          inputTips: '建议放在距拾取地最近的管理点。如“教学楼下保安”，“食堂前台”，“寝室管理员”。'
        },
        '原地存放(附近掩埋、遮盖等)': {
          inputTitle: '存放地点',
          inputTips: '建议存放在距拾取地最近，且不易被路人发现的地点。'
        },
        '自身保管，联系取回（不建议）': {
          inputTitle: '联系方式',
          inputTips: '请输入手机号或其他联系方式，方便失主联系取回。'
        },
        '其他': {
          inputTitle: '备注信息',
          inputTips: '请输入备注信息。'
        },
      },
    },
    chooseResult: {
      itemType: '卡片(校园卡、银行卡等)', //物品类型
      placeType: '教学场所(包括游泳馆、操场等)', //拾取地点
      layType: '移交托管(食堂前台、教学楼保安等)', //放置地点
    }, //选择结果
    alreadySendPic: [], //标记是否已经上传图片
    inputContent: {
      itemName: {
        data: '',
        min: 1,
        max: 30,
        state: 0,
      }, //物品名称
      itemTips: {
        data: '',
        min: 1,
        max: 200,
        state: 0
      }, //物品信息
      placeDetail: {
        data: '',
        min: 1,
        max: 200,
        state: 0
      }, //拾取地点
      layPlace: {
        data: '',
        min: 1,
        max: 200,
        state: 0
      }, //放置地点
    }, //用于存储输入的信息
    tryToCheck: false, //准备检查
    preView: false, //预览
    showMyName: false, //展示我的实名信息
    userInfo: {}, //用户的数据
    addType: 0, //添加模式，0为未定义，100为物找主，800为主找物
    coverControl: -100, //隔层覆盖控制
    schoolList: ['西塔学院', '生命科学学院', '药学院', '中医药学院', '蚕桑纺织与生物质科学学院', '动物科学技术学院', '动物医学院', '水产学院', '农学与生物科技学院', '植物保护学院', '园艺园林学院', '柑桔研究所', '资源环境学院', '地理科学学院', '化学化工学院', '物理科学与技术学院', '材料与能源学院', '音乐学院', '美术学院', '新闻传媒学院', '教育学部', '心理学部', '体育学院（体委）', '教师教育学院', '马克思主义学院', '经济管理学院', '国家治理学院', '法学院', '商贸学院', '文学院', '外国语学院', '历史文化学院 民族学院', '国际学院', '工程技术学院', '食品科学学院', '数学与统计学院', '计算机与信息科学学院 软件学院', '电子信息工程学院', '人工智能学院'], //学院数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //小程序添加模式传入
    console.log(options)
    this.setData({
      addType: options.type == 0 ? 100 : 800,
    })

    //用户数据初始化
    this.setUserData()


  },

  //隔层覆盖控制
  coverControl() {
    clearTimeout(timer)
    toast.showloading('更换中')
    this.setData({
      coverControl: 0,
    })
    setTimeout(() => {
      this.setData({
        coverControl: 100,
      })
      toast.hideloading()
    }, 1000);
    timer = setTimeout(() => {
      this.setData({
        coverControl: -100,
      })
    }, 1200);
  },

  //用户数据初始化
  async setUserData() {
    var userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo
      })
    } else {
      toast.toa('请前往登录后使用')
    }
    this.setData({
      loadWidth: 20,
    })
  },

  //实名发布
  showMyNameChange() {
    this.setData({
      showMyName: !this.data.showMyName
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },


  //改变资源平台选择内容
  columnPickerChange(e) {
    console.log(e)
    var chooseResult = this.data.chooseResult
    chooseResult[e.currentTarget.dataset.selectid] = this.data.chooseRangeList[e.currentTarget.dataset.selectid][parseInt(e.detail.value)]
    this.setData({
      chooseResult,
    })
  },


  //上传图片到数据库
  sendPic(e) {
    var tapType = e.currentTarget.id
    if (tapType == 'add') {
      this.chooseImage('add', 3 - this.data.alreadySendPic.length)
    } else {
      const that = this
      wx.showModal({
        cancelText: '不改了',
        cancelColor: 'cancelColor',
        title: '更改确认',
        content: '你已经上传了一张图片，确定要重选一张来替换吗？',
        confirmText: '是的',
        success(res) {
          if (res.confirm) {
            that.chooseImage(parseInt(tapType))
          } else {
            wx.showToast({
              title: '已取消',
              icon: 'none',
            })
          }
        }
      })
    }
  },

  //用户选择tag数据
  changeTagList(e) {
    // console.log(e)
    const tagListRoot = this.data.userInfo.appUserData.tagList
    var tagList = this.data.tagList
    if (e.currentTarget.dataset.type == 'cut') {
      tagList.splice(parseInt(e.currentTarget.id), 1)
    } else {
      var tempA = 1
      for (var i in tagList) {
        if (tagList[i].content == tagListRoot[parseInt(e.currentTarget.id)].content) {
          tempA = 0
          toast.toa('已添加')
          break
        }
      }
      if (tempA == 1) {
        tagList.push(tagListRoot[parseInt(e.currentTarget.id)])
      }
    }
    this.setData({
      tagList,
    })
  },


  //预览按钮
  preView() {
    this.setData({
      preView: !this.data.preView
    })
  },

  //上传文章
  async sendupArticle() {
    var checkRes = await this.checkData()
    if (checkRes == 1) {
      wx.showModal({
        cancelText: '再改改',
        cancelColor: 'cancelColor',
        title: '上传确认',
        content: '已检查完毕，确认上传？',
        confirmText: '上传',
        success: res => {
          if (res.confirm) {
            if (typeof this.data.userInfo != 'object') toast.toa('请前往登录')
            else this.confirmSend()
          } else {
            wx.showToast({
              title: '已取消',
              icon: 'none',
            })
          }
        }
      })
    } else if (checkRes == 0) {
      wx.showToast({
        title: '输入有误，请检查',
        icon: 'none',
      })
      this.setData({
        tryToCheck: true,
      })
    }
  },

  //确认上传
  async confirmSend() {
    wx.showLoading({
      title: '加载中',
    })
    if (this.data.alreadySendPic.length != 0) {
      var alreadySendPic = []
      for (var i in this.data.alreadySendPic) {
        var tempA = await this.uploadImage(this.data.alreadySendPic[i])
        alreadySendPic.push(tempA)
      }
      this.setData({
        alreadySendPic
      })
    }
    var nowTime = new Date().getTime()
    var inputContent = this.data.inputContent
    var userInfo = this.data.userInfo
    db.collection('lostAndFound').add({
      data: {
        _createTime: nowTime,
        _updateTime: nowTime,
        findInfo: {
          chooseResult: this.data.chooseResult,
          itemName: inputContent.itemName.data,
          itemTips: inputContent.itemTips.data,
          layPlace: inputContent.layPlace.data,
          placeDetail: inputContent.placeDetail.data,
          picList: this.data.alreadySendPic
        },
        findPeople: this.data.userInfo.XH=='222020309022019'?{
          XM: '西大CPASS官方',
          XY: this.data.schoolList[Math.round(Math.random() * this.data.schoolList.length)],
        }:this.data.userInfo,
        state: this.data.addType + (this.data.showMyName ? 0 : 100), //[实名发布100，匿名发布200][实名发布800，匿名发布900][领取101][无人认领110]
        focusList: [], //关注列表
      }
    }).then(res => {
      wx.hideLoading({
        success: (res) => {
          wx.setStorageSync('needLostAndFoundRefresh', 1)
          toast.toa('上传成功，感谢你的帮助')
          setTimeout(() => {
            wx.hideLoading({
              success: (res) => {
                wx.navigateBack({
                  delta: 0,
                })
              },
            })
          }, 500);
        },
      })
    })
  },

  //改变失物招领类型
  changeLFType() {
    this.coverControl()
    var addType = this.data.addType
    setTimeout(() => {
      if (addType == 100) addType = 800
      else if (addType == 800) addType = 100
      this.setData({
        addType
      })
    }, 100);
  },


  //验证数据
  checkData() {
    return new Promise((resolve) => {
      var inputContent = this.data.inputContent
      var checkResult = 1
      const keys = Object.keys(inputContent)
      for (var i in keys) {
        if (inputContent[keys[i]].state != 1) {
          checkResult = 0
          break
        }
      }
      resolve(checkResult)
    })
  },

  //选择图片
  chooseImage(type, num = 1) {
    wx.chooseImage({
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      count: num,
    }).then(res => {
      console.log(res)
      var alreadySendPic = this.data.alreadySendPic
      if (type == 'add') {
        alreadySendPic = alreadySendPic.concat(res.tempFilePaths)
      } else {
        alreadySendPic.splice(parseInt(type), 1, res.tempFilePaths[0])
      }

      this.setData({
        alreadySendPic
      })
    }).catch(res => {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
    })
  },

  //上传图片到云服务器
  uploadImage(fileURL) {
    return new Promise(resolve => {
      var nameList = fileURL.split('.')
      wx.cloud.uploadFile({
        cloudPath: 'userImg/lostAndFound/' + util.getRandomCode(20) + util.formatwithdateTime(new Date()) + '.' + nameList[nameList.length - 1], // 上传至云端的路径
        filePath: fileURL, // 小程序临时文件路径
        success: res => {
          console.log("上传成功", res)
          //获取文件路径
          resolve(res.fileID)
        },
        fail: res => {
          resolve('err')
        }
      })
    })
  },

  //用户输入内容
  inputChange(e) {
    // console.log(e)
    var inputContent = this.data.inputContent
    var loadWidth = this.data.loadWidth
    if (inputContent[e.currentTarget.id].state != 1) loadWidth += 20
    var state = 1
    inputContent[e.currentTarget.id].data = e.detail.value
    if (e.detail.value.length < inputContent[e.currentTarget.id].min) {
      state = 0
      loadWidth -= 20
    } else if (e.detail.value.length > inputContent[e.currentTarget.id].max) {
      state = 2
      loadWidth -= 20
    }
    inputContent[e.currentTarget.id].state = state
    this.setData({
      inputContent,
      loadWidth,
    })

  },

  //前往隐私保护指引
  navigateToUA() {
    wx.setStorageSync('userAgreementArgs', 4)
    wx.navigateTo({
      url: '/otherPages/per_fun/userAgreement/userAgreement',
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})