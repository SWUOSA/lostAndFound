import toast from '../../../utils/toast'
import Util from '../../../utils/util';

const gloData = getApp().gloData;
const db = wx.cloud.database()
const _ = db.command


Page({

  /**
   * 页面的初始数据
   */
  data: {
    tableBarH: gloData.tableBarH,
    whichRecommend: 0, //哪一个单列
    foundList: [], //物找主数据
    lostList: [], //主找物数据
    collegeData: {}, //学院数据
    refreshListControler: false, //控制刷新
    backToTop: 0, //控制·距离顶部

    readOnly_: false, //是否展示提示框
    readOnly_dataShow: [], //课程详情处理数据
    readOnly_dataTitle: '', //详情名称
    readOnly_roomInfo: '', //教室导航

    showChooseList: false, //展示选择栏目
    chooseListData: [{
      name: '卡片',
      state: false
    }, {
      name: '电子用品',
      state: false
    }, {
      name: '生活常用',
      state: false
    }, {
      name: '学习常用',
      state: false
    }, {
      name: '其他',
      state: false
    }, ], //存储院校数据

    otherTips: '', //添加检索条件
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取用户数据
    this.getUserInfo()
  },

  //获取用户数据
  getUserInfo() {
    var userInfo = wx.getStorageSync('userInfo')
    var wxUserInfo = wx.getStorageSync('wxUserInfo')
    if (userInfo && wxUserInfo) {
      this.setData({
        userInfo,
        wxUserInfo,
      })
      //获取丢失寻找数据
      this.getLostAndFoundData(20, 'before')
      //获取主找物数据
      this.lostList(20, 'before')
    } else {
      toast.toa('信息缺失，请重新登录')
      setTimeout(() => {
        wx.navigateBack({
          delta: 0,
        })
      }, 1000);
    }
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
    if (wx.getStorageSync('needLostAndFoundRefresh')) {
      wx.removeStorageSync('needLostAndFoundRefresh')
      this.setData({
        backToTop: 0
      })
      this.refreshList()
    }
  },

  //展示课程详情
  async articleDetail(e) {
    //上传浏览记录
    var foundListItem = this.data[this.data.whichRecommend == 0 ? 'foundList' : 'lostList'][parseInt(e.currentTarget.id)]
    var res = await this.uploadViewData(parseInt(e.currentTarget.id), this.data.userInfo.XH, this.data.wxUserInfo.avatarUrl)
    if (res == false) {
      this.getUserInfo()
      return
    }
    this.imageList = foundListItem.findInfo.picList
    console.log(e, foundListItem)
    var readOnly_dataShow = [
      ['物品名称', foundListItem.findInfo.itemName],
      ['具体信息', foundListItem.findInfo.itemTips],
      [this.data.whichRecommend == 0 ? '发现地点' : '丢失地点', foundListItem.findInfo.placeDetail],
      ['处理方法', foundListItem.findInfo.chooseResult.layType],
      [this.data.whichRecommend == 0 ? '放置地点' : '联系方式', foundListItem.findInfo.layPlace],
    ]
    if (this.data.whichRecommend == 1)
      readOnly_dataShow.splice(3, 1)
    this.setData({
      readOnly_: !this.data.readOnly_, //是否展示提示框
      readOnly_dataShow, //课程详情处理数据
      readOnly_dataTitle: foundListItem.findInfo.chooseResult.itemTypeShow + '详情', //详情名称
      readOnly_roomInfo: this.imageList.length == 0 ? 'noNext' : `查看 ${this.imageList.length} 张图片详情`, //教室导航
    })
  },

  //上传查看详情信息
  uploadViewData(e, stuId, avatarUrl) {
    return new Promise(async (resolve) => {
      var foundList = this.data.foundList
      if (stuId && avatarUrl && !foundList[e]['alreadySend']) {
        await db.collection('lostAndFound').doc(foundList[e]._id).update({
          data: {
            focusList: _.push({
              stuId,
              avatarUrl
            })
          }
        }).then(res => {
          console.log(res)
          foundList[e]['alreadySend'] = true
          this.setData({
            foundList
          })
          resolve(true)
        })
      } else if (foundList[e]['alreadySend']) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  },

  //模板函数
  readOnly_rightBS() {
    wx.previewImage({
      urls: this.imageList,
    })
  },

  //加载物找主数据
  getLostAndFoundData(e = 10, pos = 'after') {
    var chooseListData = this.data.chooseListData
    var chooseListDataList = []
    var inputTips = this.data.otherTips.split(';').join('；').split('；').join('|')
    for (var i in chooseListData) {
      if (chooseListData[i].state) {
        chooseListDataList.push(chooseListData[i].name)
      }
    }
    if (chooseListDataList.length == 0) {
      chooseListDataList = ['卡片', '电子用品', '生活常用', '学习常用', '其他', ]
    }
    this.setData({
      collegeData: pos == 'before' ? {} : this.data.collegeData
    })
    var foundList = pos == 'before' ? [] : this.data.foundList
    if (pos == 'before' || this.noMoreData != 1) {
      db.collection('lostAndFound').where(_.and([{
          state: _.or([100, 200]),
          _createTime: _.lt(foundList.length == 0 || pos == 'before' ? 999999999999999 : foundList[foundList.length - 1]._createTime),
          'findInfo.chooseResult.itemType':db.RegExp({
            regexp: chooseListDataList.join('|'),
            options: 'i',
          }),
        }, _.or([{
          'findInfo.itemName': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, {
          'findInfo.itemTips': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, {
          'findInfo.layPlace': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, {
          'findInfo.placeDetail': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, ]), ]))
        .orderBy('_createTime', 'desc')
        .limit(e)
        .get().then(res => {
          console.log(res)
          if (res.data.length != 0) {
            var tempB = res.data
            for (var j in tempB) {
              tempB[j]['creatTime'] = Util.format_dateTime(new Date(tempB[j]._createTime))
              tempB[j]['updateTime'] = Util.format_dateTime(new Date(tempB[j]._updateTime))
              tempB[j]['alreadySend'] = false
              tempB[j].findInfo.chooseResult['itemTypeShow'] = tempB[j].findInfo.chooseResult.itemType.split('(')[0]
              tempB[j].findInfo.chooseResult['layTypeShow'] = tempB[j].findInfo.chooseResult.layType.split('(')[0]
              tempB[j].findInfo.chooseResult['placeTypeShow'] = tempB[j].findInfo.chooseResult.placeType.split('(')[0]
              //寻找学院数据
              this.getCollegeData(tempB[j].findPeople.XY)
            }
            foundList = foundList.concat(res.data)
            this.setData({
              foundList
            })
            if (pos == 'before') toast.toa('加载成功')
          } else {
            toast.toa('下面没有啦~')
            this.noMoreData = 1
          }
        })
    } else {
      toast.toa('下面没有啦~')
    }
    this.setData({
      refreshListControler: false
    })
  },

  //加载主找物数据
  lostList(e = 10, pos = 'after') {
    var chooseListData = this.data.chooseListData
    var chooseListDataList = []
    var inputTips = this.data.otherTips.split(';').join('；').split('；').join('|')
    for (var i in chooseListData) {
      if (chooseListData[i].state) {
        chooseListDataList.push(chooseListData[i].name)
      }
    }
    if (chooseListDataList.length == 0) {
      chooseListDataList = ['卡片', '电子用品', '生活常用', '学习常用', '其他', ]
    }
    var lostList = pos == 'before' ? [] : this.data.lostList
    if (pos == 'before' || this.noMoreData != 1) {
      db.collection('lostAndFound').where(_.and([{
          state: _.or([800, 900]),
          _createTime: _.lt(lostList.length == 0 || pos == 'before' ? 999999999999999 : lostList[lostList.length - 1]._createTime),
          'findInfo.chooseResult.itemType': db.RegExp({
            regexp: chooseListDataList.join('|'),
            options: 'i',
          }),
        }, _.or([{
          'findInfo.itemName': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, {
          'findInfo.itemTips': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, {
          'findInfo.layPlace': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, {
          'findInfo.placeDetail': db.RegExp({
            regexp: inputTips,
            options: 'i',
          })
        }, ]), ]))
        .orderBy('_createTime', 'desc')
        .limit(e)
        .get().then(res => {
          console.log(res)
          if (res.data.length != 0) {
            var tempB = res.data
            for (var j in tempB) {
              tempB[j]['creatTime'] = Util.format_dateTime(new Date(tempB[j]._createTime))
              tempB[j]['updateTime'] = Util.format_dateTime(new Date(tempB[j]._updateTime))
              tempB[j]['alreadySend'] = false
              tempB[j].findInfo.chooseResult['itemTypeShow'] = tempB[j].findInfo.chooseResult.itemType.split('(')[0]
              tempB[j].findInfo.chooseResult['layTypeShow'] = tempB[j].findInfo.chooseResult.layType.split('(')[0]
              tempB[j].findInfo.chooseResult['placeTypeShow'] = tempB[j].findInfo.chooseResult.placeType.split('(')[0]
            }
            lostList = lostList.concat(res.data)
            this.setData({
              lostList
            })
          } else {
            if (pos == 'after') toast.toa('下面没有啦~')
            this.noMoreData = 1
          }
          if (pos == 'before') toast.toa('加载成功')
        })
    } else {
      if (pos == 'after') toast.toa('下面没有啦~')
    }
    this.setData({
      refreshListControler: false
    })
  },

  //寻找学院数据
  getCollegeData(e) {
    var collegeData = this.data.collegeData
    if (!collegeData[e]) {
      this.setData({
        collegeData
      })
      db.collection('lostAndFound').where({
        'findPeople.XY': e,
        state: _.or([100, 200]),
      }).count().then(res => {
        collegeData[e] = res.total
        this.setData({
          collegeData
        })
      })
    }
  },

  //控制触底刷新
  lowerRefresh() {
    if (!this.lowerRefreshTimer) {
      wx.vibrateShort({
        type: 'type',
      })
      if (this.data.whichRecommend == 0)
        this.getLostAndFoundData()
      else if (this.data.whichRecommend == 1)
        this.lostList()
      this.lowerRefreshTimer = 1
      setTimeout(() => {
        this.lowerRefreshTimer = 0
      }, 800);
    }
  },

  //改变推荐列
  recommendChange(e) {
    var index = parseInt(e.currentTarget.dataset.id)
    if (index != this.data.whichRecommend) {
      this.setData({
        whichRecommend: index,
      })
    }
  },

  //新增丢失物品
  addNewLost() {
    wx.navigateTo({
      url: `../lostFoundAdd/lostFoundAdd?type=${this.data.whichRecommend}`,
    })
  },

  //查找丢失信息
  searchLost() {
    this.setData({
      showChooseList: !this.data.showChooseList
    })
  },

  //带参数查询
  searchWithArgs() {
    this.setData({
      showChooseList: false,
    })
    this.refreshList()
  },

  //单击选择数据
  changeCooseItem(e) {
    var chooseListData = this.data.chooseListData
    chooseListData[parseInt(e.currentTarget.id)].state = !chooseListData[parseInt(e.currentTarget.id)].state
    this.setData({
      chooseListData
    })
  },

  //添加数据
  addOtherTips(e) {
    this.setData({
      otherTips: e.detail.value
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
  onPullDownRefresh: function () {},

  refreshList() {
    if (this.data.whichRecommend == 0)
      this.getLostAndFoundData(20, 'before')
    else if (this.data.whichRecommend == 1)
      this.lostList(20, 'before')
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