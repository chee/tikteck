const Blub = require('..')
const blubs = []
const paired = []

Blub.discover(blub => {
  const {address} = blub
  if (!paired.includes(address)) {
    Blub.pair(blub, dispatch => {
      blubs.push(dispatch)
      paired.push(address)
    })
  }
})

const colors = [0x33, 0xcc, 0xff]

setInterval(() =>
  blubs.forEach(dispatch => dispatch(Blub.setColors(...colors, 0xff))), 250)
