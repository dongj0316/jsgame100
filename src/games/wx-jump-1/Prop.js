import TWEEN from '@tweenjs/tween.js'
import { getPropSize, rangeNumberInclusive, animate } from './utils'

class Prop {
  constructor ({
    world, // 所处世界
    stage, // 所处舞台
    body, // 主体
    height,
    enterHeight,
    distanceRange,
    prev
  }) {
    this.world = world
    this.stage = stage
    this.body = body
    this.height = height
    this.enterHeight = enterHeight
    this.distanceRange = distanceRange
    this.prev = prev
  }

  // 计算位置
  computeMyPosition () {
    const {
      world,
      prev,
      distanceRange,
      enterHeight
    } = this
    const position = {
      x: 0,
      // 头2个盒子y值为0
      y: enterHeight,
      z: 0
    }

    if (!prev) {
      // 第1个盒子
      return position
    }

    if (enterHeight === 0) {
      // 第2个盒子，固定一个距离
      position.z = world.width / 2
      return position
    }

    const { x, z } = prev.getPosition()
    // 随机2个方向 x or z
    const direction = Math.round(Math.random()) === 0
    const { x: prevWidth, z: prevDepth } = prev.getSize()
    const { x: currentWidth, z: currentDepth } = this.getSize()
    // 根据区间随机一个距离
    const randomDistance = rangeNumberInclusive(...distanceRange)

    if (direction) {
      position.x = x + prevWidth / 2 + randomDistance + currentWidth / 2
      position.z = z
    } else {
      position.x = x
      position.z = z + prevDepth / 2 + randomDistance + currentDepth / 2
    }

    return position
  }

  // 将道具放入舞台
  enterStage () {
    const { stage, body, height } = this
    const { x, y, z } = this.computeMyPosition()

    body.castShadow = true
    body.receiveShadow = true
    body.position.set(x, y, z)
    // 需要将盒子放到地面
    body.geometry.translate(0, height / 2, 0)

    stage.add(body)
    stage.render()

    this.entranceTransition()
  }

  // 盒子的入场动画
  entranceTransition (duration = 400) {
    const { body, enterHeight, stage } = this

    if (enterHeight === 0) {
      return
    }

    animate(
      {
        to: { y: 0 },
        from: { y: enterHeight },
        duration,
        easing: TWEEN.Easing.Bounce.Out
      },
      ({ y }) => {
        body.position.setY(y)
        stage.render()
      }
    )
  }

  // 回弹动画
  springbackTransition (duration) {
    const { body, stage } = this
    const y = body.scale.y
    
    animate(
      {
        from: { y },
        to: { y: 1 },
        duration,
        easing: TWEEN.Easing.Bounce.Out
      },
      ({ y }) => {
        body.scale.setY(y)
        stage.render()
      }
    )
  }

  setNext (next) {
    this.next = next
  }

  getNext (next) {
    return this.next
  }

  getPosition () {
    return this.body.position
  }

  setPosition (x, y, z) {
    return this.body.position.set(x, y, z)
  }

  scaleY (y) {
    return this.body.scale.setY(y)
  }

  // 获取道具大小
  getSize () {
    return getPropSize(this.body)
  }

  // 销毁
  dispose () {
    const { body, stage, prev, next } = this
    // 解除关联的引用
    this.prev = null
    this.next = null
    if (prev) {
      prev.next = null
    }
    if (next) {
      next.prev = null
    }

    body.geometry.dispose()
    body.material.dispose()
    stage.remove(body)
  }
}

export default Prop