var atom = require('./atom')
  , plain = require('./plain')

var parsers = [
    atom.parse,
    plain.parse
]

exports.parse = function(item) {
   var entity = {}
   parsers.forEach(function(parser) {
       parser(item, entity)
   })
   
   return entity
}
