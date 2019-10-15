import * as THREE from 'three'
import {
  baseMeshLambertMaterial,
  baseBoxBufferGeometry,
  randomArrayElm,
  rangeNumberInclusive
} from './utils'
import { statics, actives } from './defaultProp'

class PropCreator {
  constructor ({
    propHeight,
    propSizeRange,
    needDefaultCreator
  }) {
    this.propHeight = propHeight
    this.propSizeRange = propSizeRange

    // 维护的创造器
    this.propCreators = []

    if (needDefaultCreator) {
      this.createPropCreator(actives, false)
      this.createPropCreator(statics, true)
    }
  }

  createProp (index) {
    const { propCreators } = this
    return index > -1
      ? propCreators[index] && propCreators[index]() || randomArrayElm(propCreators)()
      : randomArrayElm(propCreators)()
  }

  /**
   * 新增定制化的创造器
   * @param {Function} creator 创造器函数
   * @param {Boolean} isStatic 是否是动态创建
   */
  createPropCreator (creator, isStatic) {
    if (Array.isArray(creator)) {
      creator.forEach(crt => this.createPropCreator(crt, isStatic))
      return
    }

    const { propCreators, propSizeRange, propHeight } = this

    if (propCreators.indexOf(creator) > -1) {
      return
    }

    const wrappedCreator = function () {
      if (isStatic && wrappedCreator.box) {
        // 静态盒子，下次直接clone
        return wrappedCreator.box.clone()
      } else {
        const box = creator(THREE, {
          propSizeRange,
          propHeight,
          baseMeshLambertMaterial,
          baseBoxBufferGeometry
        })

        if (isStatic) {
          // 被告知是静态盒子，缓存起来
          wrappedCreator.box = box
        }
        return box
      }
    }

    propCreators.push(wrappedCreator)
  }
}

export default PropCreator