import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import {
  baseMeshLambertMaterial,
  computeObligueThrowValue,
  computePositionByRangeR,
  animate
} from './utils'

class LittleMan {
  constructor ({
    world,
    color,
    G
  }) {
    this.world = world
    this.color = color
    this.G = G
    this.v0 = world.width / 10
    this.theta = 90

    this.headSegment = null
    this.bodyScaleSegment = null
    this.bodyRotateSegment = null
    this.body = null

    this.currentProp = null
    this.nextProp = null
    this.powerStorageDuration = 1500

    this.stage = null

    this.createBody()
    this.resetPowerStorageParameter()
  }

  bindEvent () {
    const { container } = this.world
    const isMobile = 'ontouchstart' in document
    const mousedownName = isMobile ? 'touchstart' : 'mousedown'
    const mouseupName = isMobile ? 'touchend' : 'mouseup'
    
    // 该起跳了
    const mouseup = () => {
      if (this.jumping) {
        return
      }
      this.jumping = true
      // 蓄力动作应该停止
      this.poweringUp = false

      this.jump()
      container.removeEventListener(mouseupName, mouseup)
    }

    // 蓄力的时候
    const mousedown = event => {
      event.preventDefault()
      // 跳跃没有完成不能操作
      if (this.poweringUp || this.jumping || !this.currentProp) {
        return
      }
      this.poweringUp = true

      this.powerStorage()
      container.addEventListener(mouseupName, mouseup, false)
    }

    container.addEventListener(mousedownName, mousedown, false)
  }

  // 创建身体
  createBody () {
    const { color, world: { width } } = this
    const material = baseMeshLambertMaterial.clone()
    material.setValues({ color })

    // 头部
    const headSize = this.headSize = width * .03
    const headTranslateY = this.headTranslateY = headSize * 4.5
    const headGeometry = new THREE.SphereGeometry(headSize, 40, 40)
    const headSegment = this.headSegment = new THREE.Mesh(headGeometry, material)
    headSegment.castShadow = true
    headSegment.translateY(headTranslateY)

    // 身体
    this.bodySize = headSize * 4.5
    const bodyBottomGeometry = new THREE.CylinderBufferGeometry(headSize * .9, headSize * 1.2, headSize * 2.5, 40)
    bodyBottomGeometry.translate(0, headSize * 1.25, 0)
    const bodyCenterGeometry = new THREE.CylinderBufferGeometry(headSize, headSize * .9, headSize, 40)
    bodyCenterGeometry.translate(0, headSize * 3, 0)
    const bodyTopGeometry = new THREE.SphereGeometry(headSize, 40, 40)
    bodyTopGeometry.translate(0, headSize * 3.5, 0)

    const bodyGeometry = new THREE.Geometry()
    bodyGeometry.merge(bodyTopGeometry)
    bodyGeometry.merge(new THREE.Geometry().fromBufferGeometry(bodyCenterGeometry))
    bodyGeometry.merge(new THREE.Geometry().fromBufferGeometry(bodyBottomGeometry))

    // 缩放控制
    const bodyScaleSegment = this.bodyScaleSegment = new THREE.Mesh(bodyGeometry, material)
    bodyScaleSegment.castShadow = true
    bodyScaleSegment.translateY(-20)

    // 旋转控制
    const bodyRotateSegment = this.bodyRotateSegment = new THREE.Group()
    bodyRotateSegment.add(headSegment)
    bodyRotateSegment.add(bodyScaleSegment)
    bodyRotateSegment.translateY(20)

    // 整体身高 = 头部位移 + 头部高度 / 2 = headSize * 5.5
    const body = this.body = new THREE.Group()
    body.add(bodyRotateSegment)
  }

  // 进入舞台
  enterStage (stage, { x, y, z }, nextProp) {
    const { body } = this

    body.position.set(x, y, z)

    this.stage = stage
    // 进入舞台时告诉小人目标
    this.nextProp = nextProp

    stage.add(body)
    stage.render()
    this.bindEvent()
  }

  resetPowerStorageParameter () {
    // 由于蓄力导致的变形，需要记录后，在空中将小人复原
    this.toValues = {
      headTranslateY: 0,
      bodyScaleXZ: 0,
      bodyScaleY: 0
    }
    this.fromValues = this.fromValues || {
      headTranslateY: this.headTranslateY,
      bodyScaleXZ: 1,
      bodyScaleY: 1,
      propScaleY: 1
    }
  }

  // 蓄力
  powerStorage () {
    const {
      stage, powerStorageDuration,
      body, bodyScaleSegment, headSegment,
      bodySize,
      fromValues,
      currentProp,
      world: { propHeight }
    } = this

    this.powerStorageTime = Date.now()
    this.resetPowerStorageParameter()

    const tween = animate(
      {
        from: { ...fromValues },
        to: {
          headTranslateY: bodySize - bodySize * .6,
          bodyScaleXZ: 1.3,
          bodyScaleY: .6,
          propScaleY: .6
        },
        duration: powerStorageDuration
      },
      ({ headTranslateY, bodyScaleXZ, bodyScaleY, propScaleY }) => {
        if (!this.poweringUp) {
          // 抬起时停止蓄力
          tween.stop()
        } else {
          
          headSegment.position.setY(headTranslateY)
          bodyScaleSegment.scale.set(bodyScaleXZ, bodyScaleY, bodyScaleXZ)
          currentProp.scaleY(propScaleY)
          body.position.setY(propHeight * propScaleY)

          // 保存此时的位置用于复原
          this.toValues = {
            headTranslateY,
            bodyScaleXZ,
            bodyScaleY
          }

          stage.render()
        }
      }
    )
  }

  computePowerStorageValue () {
    const { powerStorageDuration, powerStorageTime, v0, theta } = this
    const diffTime = Date.now() - powerStorageTime
    const time = Math.min(diffTime, powerStorageDuration)
    const percentage = time / powerStorageDuration

    return {
      v0: v0 + 30 * percentage,
      theta: theta - 40 * percentage
    }
  }

  // 跳跃
  jump () {
    const {
      stage, body,
      currentProp, nextProp,
      world: { propHeight }
    } = this
    const duration = 400
    const start = body.position
    const target = nextProp.getPosition()
    const { x: startX, y: startY, z: startZ } = start

    // 开始游戏时，小人从第一个盒子正上方入场做弹球下落
    if (!currentProp && startX === target.x && startZ === target.z) {
      animate(
        {
          from: { y: startY },
          to: { y: propHeight },
          duration,
          easing: TWEEN.Easing.Bounce.Out
        },
        ({ y }) => {
          body.position.setY(y)
          stage.render()
        },
        () => {
          this.currentProp = nextProp
          this.nextProp = nextProp.getNext()
          this.jumping = false
        }
      )
    } else {
      if (!currentProp) {
        return
      }

      const { bodyScaleSegment, headSegment, G, headTranslateY } = this
      const { v0, theta } = this.computePowerStorageValue()
      const { rangeR, rangeH } = computeObligueThrowValue(v0, theta * (Math.PI / 180), G)

      // 水平匀速
      const { jumpDownX, jumpDownZ } = computePositionByRangeR(rangeR, start, target)
      animate(
        {
          from: {
            x: startX,
            z: startZ,
            ...this.toValues
          },
          to: {
            x: jumpDownX,
            z: jumpDownZ,
            ...this.fromValues
          },
          duration
        },
        ({ x, z, headTranslateY, bodyScaleXZ, bodyScaleY }) => {
          body.position.setX(x)
          body.position.setZ(z)
          headSegment.position.setY(headTranslateY)
          bodyScaleSegment.scale.set(bodyScaleXZ, bodyScaleY, bodyScaleXZ)
        }
      )

      // y轴上升段、下降段
      const rangeHeight = Math.max(this.world.width / 3, rangeH) + propHeight
      const yUp = animate(
        {
          from: { y: startY },
          to: { y: rangeHeight },
          duration: duration * .65,
          easing: TWEEN.Easing.Cubic.Out,
          autoStart: false
        },
        ({ y }) => {
          body.position.setY(y)
        }
      )
      const yDown = animate(
        {
          from: { y: rangeHeight },
          to: { y: propHeight },
          duration: duration * .35,
          easing: TWEEN.Easing.Cubic.In,
          autoStart: false
        },
        ({ y }) => {
          body.position.setY(y)
        }
      )

      // 落地后，生成下一个方块 -> 移动镜头 -> 更新关心的盒子 -> 结束
      const ended = () => {
        const { world } = this
        world.createProp()
        world.moveCamera()

        this.currentProp = nextProp
        this.nextProp = nextProp.getNext()
        // 跳跃结束了
        this.jumping = false
      }
      // 落地缓冲段
      const bufferUp = animate(
        {
          from: { s: .8 },
          to: { s: 1 },
          duration: 100,
          autoStart: false
        },
        ({ s }) => {
          bodyScaleSegment.scale.setY(s)
        },
        () => {
          // 以落地缓冲结束作为跳跃结束时间点
          ended()
        }
      )

      // 上升 -> 下降 -> 落地缓冲
      yDown.chain(bufferUp)
      yUp.chain(yDown).start()

      // 需要处理不同方向空翻
      const direction = currentProp.getPosition().z === nextProp.getPosition().z
      this.flip(duration, direction)

      // 从起跳开始就回弹
      currentProp.springbackTransition(500)
    }

    stage.render()
  }

  // 空翻
  flip (duration, direction) {
    const { bodyRotateSegment } = this
    let increment = 0

    animate(
      {
        from: { deg: 0 },
        to: { deg: 360 },
        duration,
        easing: TWEEN.Easing.Sinusoidal.InOut
      },
      ({ deg }) => {
        if (direction) {
          bodyRotateSegment.rotateZ(-(deg - increment) * (Math.PI/180))
        } else {
          bodyRotateSegment.rotateX((deg - increment) * (Math.PI/180))
        }
        increment = deg
      }
    )
  }
}

export default LittleMan