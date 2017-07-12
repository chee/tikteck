Array.prototype.mapPairs = function (fn) {
  // only works on evenly lengthed lists
  const length = this.length
  const out = []
  for (let i = 0; i < length; i += 2) {
    out.push(fn([this[i], this[i + 1]]))
  }
  return out
}
const net = require('net')
const socket = net.connect('/tmp/blub')
const tinygradient = require('tinygradient')

const rainbow = tinygradient([
  '#ff2217',
  '#ffaa11',
  '#eeee22',
  '#33ff66',
  '#33ccff',
  '#1111ee',
  'purple',
  '#9933ec',
  '#ff22ee',
  '#ff2217'
]).rgb(9 * 9 * 2)

// const rainbow = tinygradient([
//   'red',
//   'orange',
//   'yellow',
//   'green',
//   'blue',
//   'indigo',
//   'violet'
// ]).rgb(7 * 7 * 2)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

;(async () => {
  while (true) {
    for (const color of rainbow) {
      console.log(`writing ${color.toHexString()}`)
      socket.write(color.toHexString())
      await new Promise(resolve => setTimeout(resolve, 7 * 7 * 2))
    }
  }
})()
