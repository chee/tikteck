const net = require('net')
const socket = net.connect('/tmp/blub')

// const rainbow = [
//   [0xff, 0x22, 0x17],
//   [0xff, 0xaa, 0x11],
//   [0xee, 0xee, 0x22],
//   [0x33, 0xff, 0x99],
//   [0x33, 0xcc, 0xff],
//   [0x11, 0x11, 0xee],
//   [0x99, 0x33, 0xec],
//   [0xff, 0x22, 0xee]
// ]

const rainbow = [
  'ff2217',
  'ffaa11',
  'eeee22',
  '33ff66',
  '33ccff',
  '1111ee',
  '9933ec',
  'ff22ee'
]

;(async () => {
  let index = 0
  while (true) {
    index = index >= rainbow.length ? 0 : index + 1
    socket.write(`#${rainbow[index]}`)
    await new Promise(resolve => setTimeout(resolve, 500))
  }
})()
