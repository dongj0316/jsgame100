import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

const { random, sqrt, floor, pow, sin, cos, tan, PI } = Math

/**
 * 根据角度计算相机初始位置
 * @param {Number} verticalDeg 相机和场景中心点的垂直角度
 * @param {Number} horizontalDeg 相机和x轴的水平角度
 * @param {Number} top 相机上侧面
 * @param {Number} bottom 相机下侧面
 * @param {Number} near 摄像机视锥体近端面
 * @param {Number} far 摄像机视锥体远端面
 */
export function computeCameraInitalPosition (verticalDeg, horizontalDeg, top, bottom, near, far) {
  const verticalRadian = verticalDeg * (PI / 180)
  const horizontalRadian = horizontalDeg * (PI / 180)
  const minY = cos(verticalRadian) * bottom
  const maxY = sin(verticalRadian) * (far - near - top / tan(verticalRadian))

  if (minY > maxY) {
    console.warn('警告: 垂直角度太小了!')
    return
  }
  const y = minY + (maxY - minY) / 2
  const longEdge = y / tan(verticalRadian)
  const x = sin(horizontalRadian) * longEdge
  const z = cos(horizontalRadian) * longEdge

  return { x, y, z }
}

// 材质
export const baseMeshLambertMaterial = new THREE.MeshLambertMaterial()
// 立方体
export const baseBoxBufferGeometry = new THREE.BoxBufferGeometry()

export const randomArrayElm = array => array[floor(random() * array.length)]

export const rangeNumberInclusive = (min, max) => floor(random() * (max - min + 1)) + min

export const getPropSize = box => {
  const box3 = getPropSize.box3 || (getPropSize.box3 = new THREE.Box3())
  box3.setFromObject(box)
  return box3.getSize(new THREE.Vector3())
}

// 斜抛计算
export const computeObligueThrowValue = function (v0, theta, G) {
  const sin2θ = sin(2 * theta)
  const sinθ = sin(theta)

  const rangeR = pow(v0, 2) * sin2θ / G
  const rangeH = pow(v0 * sinθ, 2) / (2 * G)
  // const rangeT = 2 * v0 * sinθ / G

  return {
    rangeR,
    rangeH,
    // rangeT
  }
}

/**
 * 根据射程算出落地点
 * @param {Number} range 射程
 * @param {Object} c1 起跳点
 * @param {Object} p2 目标盒子中心点
 */
export const computePositionByRangeR = function (range, c1, p2) {
  const { x: c1x, z: c1z } = c1
  const { x: p2x, z: p2z } = p2

  const p2cx = p2x - c1x
  const p2cz = p2z - c1z
  const p2c = sqrt(pow(p2cz, 2) + pow(p2cx, 2))

  const jumpDownX = p2cx * range / p2c
  const jumpDownZ = p2cz * range / p2c

  return {
    jumpDownX: c1x + jumpDownX,
    jumpDownZ: c1z + jumpDownZ
  }
}

export const animate = (configs, onUpdate, onComplete) => {
  const {
    from, to, duration,
    easing = k => k,
    autoStart = true // 为了使用tween的chain
  } = configs

  const tween = new TWEEN.Tween(from)
    .to(to, duration)
    .easing(easing)
    .onUpdate(onUpdate)
    .onComplete(() => {
      onComplete && onComplete()
    })

  if (autoStart) {
    tween.start()
  }

  animateFrame()
  return tween
}

const animateFrame = function () {
  if (animateFrame.openin) {
    return
  }
  animateFrame.openin = true

  const animate = () => {
    const id = requestAnimationFrame(animate)
    if (!TWEEN.update()) {
      animateFrame.openin = false
      cancelAnimationFrame(id)
    }
  }
  animate()
}