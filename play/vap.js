(async () => {
  const net = require('net')
  const socket = net.connect('/tmp/blub')
  const pink = '#f8caff'
  const blue = '#72f0ca'
  let color = pink
  while (true) {
    color = color === pink ? blue : pink
    socket.write(color)
    await new Promise(resolve => setTimeout(resolve, 700))
  }
})()
