const crypto = require('crypto')
const noble = global.noble = require('noble')
let mac = '00:21:4d:03:20:1b'
let macArray = mac.split(':')
const name = 'Smart Light'
const password = '234'
let colors = [
  0xff,
  0xff,
  0xff,
  0xff
]
let packetCount = Math.random() * 0xffff | 0
packetCount = 1
let light = null
let ch = null

const range = to => Array(to).fill().map((_, i) => i)

function encrypt (key, data) {
  key = Buffer.from(key)
  key.reverse()
  data = Buffer.from(data)
  data.reverse()
  const cipher = crypto.createCipheriv('aes-128-ecb', key, Buffer.from([]))
  const encryptedData = cipher.update(data).reverse()
  return  encryptedData
}

function generateSk (name, password, data1, data2) {
  name = Buffer.from(name.padEnd(16, '\u0000'))
  password = Buffer.from(password.padEnd(16, '\u0000'))
  const key = []
  name.forEach((byte, index) => {
    key.push(byte ^ password[index])
  })
  const data = [...data1.slice(0, 8), ...data2.slice(0, 8)]
  return encrypt(key, data)
}

function keyEncrypt (name, password, data) {
  name = Buffer.from(name.padEnd(16, '\u0000'))
  password = Buffer.from(password.padEnd(16, '\u0000'))
  const key = []
  ;[].forEach.call(name, (byte, index) => {
    key.push(byte ^ password[index])
  })
  return encrypt(data, key)
}

function encryptPacket (sk, mac, packet) {
  let tmp = [mac[0], mac[1], mac[2], mac[3], 0x01, packet[0], packet[1], packet[2], 15, 0, 0, 0, 0, 0, 0, 0]
  tmp = encrypt(sk, tmp)
  let i = 0

  range(15).forEach(i => {
    tmp[i] = tmp[i] ^ packet[i + 5]
  })

  tmp = encrypt(sk, tmp)

  range(2).forEach(i => {
    packet[i + 3] = tmp[i]
  })

  tmp = [0, mac[0], mac[1], mac[2], mac[3], 0x01, packet[0], packet[1], packet[2], 0, 0, 0, 0, 0, 0, 0]

  tmp2 = []

  range(15).forEach(i => {
    if (i === 0) {
      tmp2 = encrypt(sk, tmp)
      tmp[0] = tmp[0] + 1
    }
    packet[i + 5] ^= tmp2[i]
  })

  return Buffer.from(packet)
}

const nobleReady = new Promise(resolve =>
  noble.on('stateChange', state => {
    state === 'poweredOn' && resolve()
  })
)

global.connect = async function connect () {
  global.light = light = await new Promise(resolve => {
    noble.on('discover', thing => {
      thing.address === mac && resolve(thing)
    })
    noble.startScanning()
  })
  .then(light => new Promise(resolve => light.connect(() => resolve(light))))
  await new Promise(resolve => light.discoverAllServicesAndCharacteristics(() => resolve()))
  ch = light.services[1].characteristics[1]
  pairch = light.services[1].characteristics[3]
  const pairHandle = 0x001b

  // light now has .services each with .characteristics
  const data = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0, 0, 0, 0, 0, 0, 0, 0]
  const encryptedData = keyEncrypt(name, password, data)
  const packet = [0x0c]
    .concat(data.slice(0, 8))
    .concat(Array.from(encryptedData).slice(0, 8))
  await new Promise(resolve => pairch.write(new Buffer(packet), true, resolve))
  const received = await new Promise((resolve, reject) => pairch.read((error, data) =>
    error ? reject(error) : resolve(data)
  ))
  light.sk = generateSk(name, password, data.slice(0, 8), received.slice(1, 9))
  return light
}

global.sendPacket = async function sendPacket (id, command, data) {
  const packet = Array(20).fill(0)
  packet[0] = packetCount & 0xff
  packet[1] = packetCount >> 8 & 0xff
  packet[5] = id & 0xff
  packet[6] = id & 0xff | 0x80
  packet[7] = command
  packet[8] = 0x69
  packet[9] = 0x69
  packet[10] = data[0]
  packet[11] = data[1]
  packet[12] = data[2]
  packet[13] = data[3]
  const mac = Buffer.from([macArray[5], macArray[4], macArray[3], macArray[2], macArray[1], macArray[0]].map(n => parseInt(n, 16)))
  const encryptedPacket = encryptPacket(light.sk, mac, [...packet])
  packetCount += 1
  if (packetCount > 0xffff) packetCount = 1

  return new Promise(resolve => ch.write(encryptedPacket, false, resolve))
}

global.setState = function setState (red, green, blue, brightness) {
  colors = [red, green, blue, brightness]
  return sendPacket(0xffff, 0xc1, colors)
}

function setDefaultState (...colors) {
  return sendPacket(0xffff, 0xc4, colors)
}

/// brightness, speed, mode, loop
function setRainbow (...args) {
  return sendPacket(0xffff, 0xca, args)
}

function setMosquito (brightness) {
  return sendPacket(0xffff, 0xcb, [brightness, 0, 0, 0])
}

const byte = () => Math.random() * 0xff | 0

nobleReady.then(global.connect).then(() => {
  setInterval(() => {
    setState(byte(), byte(), byte(), byte())
  }, 300)
})
