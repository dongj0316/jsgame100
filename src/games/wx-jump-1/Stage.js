import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import { baseMeshLambertMaterial, animate } from './utils'

class Stage {
  constructor ({
    width,
    height,
    canvas,
    axesHelper = false, // 辅助线
    cameraNear, // 相机近截面
    cameraFar, // 相机远截面
    cameraInitalPosition, // 相机初始位置
    lightInitalPosition // 光源初始位置
  }) {
    this.width = width
    this.height = height
    this.canvas = canvas
    this.axesHelper = axesHelper
    // 正交相机配置
    this.cameraNear = cameraNear
    this.cameraFar = cameraFar
    this.cameraInitalPosition = cameraInitalPosition
    this.lightInitalPosition = lightInitalPosition
    
    this.scene = null
    this.plane = null
    this.light = null
    this.camera = null
    this.renderer = null

    this.init()
  }

  init () {
    this.createScene()
    this.createPlane()
    this.createLight()
    this.createCamera()
    this.createRenterer()
    this.render()
  }

  // 场景
  createScene () {
    const scene = this.scene = new THREE.Scene()
    scene.background = new THREE.Color(0xd6dbdf)

    if (this.axesHelper) {
      scene.add(new THREE.AxesHelper(10e3))
    }
  }

  // 地面
  createPlane () {
    const { scene } = this
    const geometry = new THREE.PlaneBufferGeometry(10e2, 10e2, 1, 1)
    const meterial = new THREE.ShadowMaterial()
    meterial.opacity = 0.5

    const plane = this.plane = new THREE.Mesh(geometry, meterial)

    plane.rotation.x = -.5 * Math.PI
    plane.position.y = -.1
    // 接收阴影
    plane.receiveShadow = true
    scene.add(plane)
  }

  // 光
  createLight () {
    const { scene, lightInitalPosition: { x, y, z }, height } = this
    const light = this.light = new THREE.DirectionalLight(0xffffff, .5)
    const lightTarget = this.lightTarget = new THREE.Object3D()

    light.target = lightTarget
    light.position.set(x, y, z)
    // 开启阴影投射
    light.castShadow = true
    // // 定义可见域的投射阴影
    light.shadow.camera.left = -height
    light.shadow.camera.right = height
    light.shadow.camera.top = height
    light.shadow.camera.bottom = -height
    light.shadow.camera.near = 0
    light.shadow.camera.far = 2000
    // 定义阴影的分辨率
    light.shadow.mapSize.width = 1600
    light.shadow.mapSize.height = 1600

    // 环境光
    scene.add(new THREE.AmbientLight(0xE5E7E9, .4))
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, .2))
    scene.add(lightTarget)
    scene.add(light)
  }

  // 相机
  createCamera () {
    const {
      scene,
      width, height,
      cameraInitalPosition: { x, y, z },
      cameraNear, cameraFar
    } = this
    const camera = this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, cameraNear, cameraFar)

    camera.position.set(x, y, z)
    camera.lookAt(scene.position)
    scene.add(camera)
  }

  // 渲染器
  createRenterer () {
    const { canvas, width, height } = this
    const renderer = this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // 透明场景
      antialias:true // 抗锯齿
    })

    renderer.setSize(width, height)
    // 开启阴影
    renderer.shadowMap.enabled = true
    // 设置设备像素
    renderer.setPixelRatio(window.devicePixelRatio)
  }

  // 执行渲染
  render () {
    const { scene, camera } = this
    this.renderer.render(scene, camera)
  }

  // center为2个盒子的中心点
  moveCamera ({ cameraTo, center, lightTo }, onComplete, duration) {
    const {
      camera, plane,
      light, lightTarget,
      lightInitalPosition
    } = this

    // 移动相机
    animate(
      {
        from: { ...camera.position },
        to: cameraTo,
        duration
      },
      ({ x, y, z }) => {
        camera.position.x = x
        camera.position.z = z
        this.render()
      },
      onComplete
    )

    // 灯光和目标也需要动起来，为了保证阴影位置不变
    const { x: lightInitalX, z: lightInitalZ } = lightInitalPosition
    animate(
      {
        from: { ...light.position },
        to: lightTo,
        duration
      },
      ({ x, y, z }) => {
        lightTarget.position.x = x - lightInitalX
        lightTarget.position.z = z - lightInitalZ
        light.position.set(x, y, z)
      }
    )

    // 保证不会跑出有限大小的地面
    plane.position.x = center.x
    plane.position.z = center.z
  }

  // 场景中添加物体
  add (...args) {
    return this.scene.add(...args)
  }
  // 移除场景中的物体
  remove (...args) {
    return this.scene.remove(...args)
  }
}

export default Stage