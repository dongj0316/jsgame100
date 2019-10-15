import {
  computeCameraInitalPosition,
  getPropSize,
  rangeNumberInclusive,
  animate
} from './utils'
import TWEEN from '@tweenjs/tween.js'
import Stage from './Stage'
import PropCreator from './PropCreator'
import Prop from './Prop'
import LittleMan from './LittleMan'

class JumpGameWorld {
  constructor ({
    container,
    canvas,
    needDefaultCreator = true,
    axesHelper = false
  }) {
    const { offsetWidth, offsetHeight } = container
    this.G = 9.8
    this.container = container
    this.canvas = canvas
    this.width = offsetWidth
    this.height = offsetHeight
    this.needDefaultCreator = needDefaultCreator
    this.axesHelper = axesHelper

    const [min, max] = [~~(offsetWidth / 6), ~~(offsetWidth / 3.5)]
    this.propSizeRange = [min, max]
    this.propHeight = ~~(max / 2)
    this.propDistanceRange = [~~(min / 2), max * 2]

    this.stage = null
    this.propCreator = null

    this.init()
  }

  init () {
    this.initStage()
    this.initPropCreator()
    this.computeSafeClearLength()
    // 第一个道具
    this.createProp(0)
    // 第二个道具
    this.createProp(0)
    // 首次调整相机
    this.moveCamera(0)
    this.initLittleMan()

    // 测试
    // const autoMove = () => {
    //   setTimeout(() => {
    //     autoMove()
    //     this.createProp()
    //     this.moveCamera()
    //   }, 2000)
    // }
    // autoMove()
  }

  // 初始化舞台
  initStage () {
    const { container, canvas, axesHelper, width, height } = this
    const cameraNear = 0.1
    const cameraFar = 2000
    // 计算相机应该放在哪里
    const cameraInitalPosition = this.cameraInitalPosition = computeCameraInitalPosition(35, 225, height / 2, height / 2, cameraNear, cameraFar)
    const lightInitalPosition = this.lightInitalPosition = { x: -300, y: 600, z: 200 }

    this.stage = new Stage({
      width,
      height,
      canvas,
      axesHelper,
      cameraNear,
      cameraFar,
      cameraInitalPosition,
      lightInitalPosition
    })
  }

  // 初始化道具生成器
  initPropCreator () {
    const { needDefaultCreator, propSizeRange, propHeight } = this

    // 管理所有道具
    this.props = []
    this.propCreator = new PropCreator({
      propHeight,
      propSizeRange,
      needDefaultCreator
    })
  }

  // 对外的新增生成器的接口
  createPropCreator (...args) {
    this.propCreator.createPropCreator(...args)
  }

  // 初始化小人
  initLittleMan () {
    const { stage, propHeight, G, props } = this
    const littleMan = this.littleMan = new LittleMan({
      world: this,
      color: 0x386899,
      G
    })
    littleMan.enterStage(stage, { x: 0, y: propHeight + 80, z: 0 }, props[0])
    littleMan.jump()
  }

  // 创建盒子
  createProp (enterHeight = 100) {
    const {
      height,
      propCreator,
      propHeight,
      propSizeRange: [min, max],
      propDistanceRange,
      stage, props,
      props: { length }
    } = this
    const currentProp = props[length - 1]
    const prop = new Prop({
      world: this,
      stage,
      // 头2个盒子用第一个创造器生成
      body: propCreator.createProp(length < 3 ? 0 : -1),
      height: propHeight,
      prev: currentProp,
      enterHeight,
      distanceRange: propDistanceRange
    })
    const size = prop.getSize()

    if (size.y !== propHeight) {
      console.warn(`高度: ${size.y},盒子高度必须为 ${propHeight}`)
    }
    if (size.x < min || size.x > max) {
      console.warn(`宽度: ${size.x}, 盒子宽度必须为 ${min} - ${max}`)
    }
    if (size.z < min || size.z > max) {
      console.warn(`深度: ${size.z}, 盒子深度度必须为 ${min} - ${max}`)
    }

    if (currentProp) {
      currentProp.setNext(prop)
    }

    prop.enterStage()
    props.push(prop)
  }

  // 移动相机，总是看向最后2个小球的中间位置
  moveCamera (duration = 500) {
    const {
      stage,
      height,
      cameraInitalPosition: { x: cameraX, y: cameraY, z: cameraZ },
      lightInitalPosition: { x: lightX, y: lightY, z: lightZ }
    } = this
    // 将可视区向上偏移一点，这样看起来道具的位置更合理
    const cameraOffsetY = height / 10

    const { x, y, z } = this.getLastTwoCenterPosition()
    const cameraTo = {
      x: x + cameraX + cameraOffsetY,
      y: cameraY, // 高度是不变的
      z: z + cameraZ + cameraOffsetY
    }
    const lightTo = {
      x: x + lightX,
      y: lightY,
      z: z + lightZ
    }

    // 移动舞台相机
    const options = {
      cameraTo,
      lightTo,
      center: { x, y, z }
    }
    stage.moveCamera(
      options,
      () => {
        this.clearProps()
      },
      duration
    )
  }

  // 计算最新的2个盒子的中心点
  getLastTwoCenterPosition () {
    const { props, props: { length } } = this
    const { x: x1, z: z1 } = props[length - 2].getPosition()
    const { x: x2, z: z2 } = props[length - 1].getPosition()

    return {
      x: x1 + (x2 - x1) / 2,
      z: z1 + (z2 - z1) / 2
    }
  }

  // 销毁道具
  clearProps () {
    const {
      width,
      height,
      safeClearLength,
      props, stage,
      props: { length }
    } = this
    const point = 4

    if (length > safeClearLength) {
      props.slice(0, point).forEach(prop => prop.dispose())
      this.props = props.slice(point)
    }
  }

  // 估算销毁安全值
  computeSafeClearLength () {
    const { width, height, propSizeRange } = this
    const minS = propSizeRange[0]
    const hypotenuse = Math.sqrt(minS * minS + minS * minS)
    this.safeClearLength = Math.ceil(width / minS) + Math.ceil(height / hypotenuse / 2) + 1
  }
}

export default JumpGameWorld